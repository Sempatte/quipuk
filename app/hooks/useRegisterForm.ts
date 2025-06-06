// hooks/useRegisterForm.ts
import { useState, useCallback, useMemo } from 'react';
import { registerSchema, RegisterFormData } from '@/app/schemas/registerSchema';
import { ZodError, z } from 'zod';

interface FormErrors {
  [key: string]: string;
}

interface UseRegisterFormReturn {
  formData: RegisterFormData;
  errors: FormErrors;
  isValid: boolean;
  updateField: (field: keyof RegisterFormData, value: string | boolean) => void;
  validateField: (field: keyof RegisterFormData) => void;
  validateForm: () => boolean;
  clearErrors: () => void;
  resetForm: () => void;
}

const initialFormData: RegisterFormData = {
  fullName: '',
  email: '',
  countryCode: 'PE', // Perú por defecto
  phoneNumber: '',
  username: '',
  password: '',
  confirmPassword: '',
  acceptedTerms: false,
};

export const useRegisterForm = (): UseRegisterFormReturn => {
  const [formData, setFormData] = useState<RegisterFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});

  // Actualizar campo individual
const updateField = useCallback((field: keyof RegisterFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
      setErrors(prev => {
       if (prev[field]) {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
       }
       return prev;
      });
 }, []);

  // Validar campo individual
  const validateField = useCallback((field: keyof RegisterFormData) => {
    try {
      // Para campos que dependen de otros (como confirmPassword), validar todo el objeto
      if (field === 'confirmPassword') {
        // Validar solo la lógica de confirmPassword
        if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
          setErrors(prev => ({
            ...prev,
            confirmPassword: 'Las contraseñas no coinciden'
          }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.confirmPassword;
            return newErrors;
          });
        }
        return;
      }

      // Para otros campos, crear un objeto temporal solo con ese campo para validar
      const tempData = { [field]: formData[field] };
      
      // Validaciones específicas por campo
      switch (field) {
        case 'fullName':
          const fullNameSchema = z.string()
            .min(10, 'El nombre debe tener al menos 10 caracteres')
            .max(50, 'El nombre no puede exceder 50 caracteres')
            .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
            .refine(val => val.trim().split(' ').length >= 2, 'Debe incluir nombre y apellido');
          
          fullNameSchema.parse(formData[field]);
          break;

        case 'email':
          const emailSchema = z.string()
            .email('Ingresa un email válido')
            .min(1, 'El email es obligatorio')
            .refine(val => {
              const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
              return emailRegex.test(val);
            }, 'Formato de email inválido');
          
          emailSchema.parse(formData[field]);
          break;

        case 'countryCode':
          const countrySchema = z.string().min(1, 'Selecciona un país');
          countrySchema.parse(formData[field]);
          break;

        case 'phoneNumber':
          const phoneSchema = z.string()
            .min(7, 'El teléfono debe tener al menos 7 dígitos')
            .max(15, 'El teléfono no puede exceder 15 dígitos')
            .regex(/^[\d\s\-\(\)]+$/, 'Solo se permiten números, espacios, guiones y paréntesis');
          
          phoneSchema.parse(formData[field]);
          break;

        case 'username':
          const usernameSchema = z.string()
            .min(6, 'El usuario debe tener al menos 6 caracteres')
            .max(20, 'El usuario no puede exceder 20 caracteres')
            .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guión bajo')
            .regex(/^[a-zA-Z]/, 'El usuario debe comenzar con una letra');
          
          usernameSchema.parse(formData[field]);
          break;

        case 'password':
          const passwordSchema = z.string()
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .max(100, 'La contraseña no puede exceder 100 caracteres')
            .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número');
          
          passwordSchema.parse(formData[field]);
          break;

        case 'acceptedTerms':
          const termsSchema = z.boolean().refine(val => val === true, 'Debes aceptar los términos y condiciones');
          termsSchema.parse(formData[field]);
          break;

        default:
          break;
      }
      
      // Si no hay error, limpiar el error existente
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldError = error.errors[0]?.message;
        if (fieldError) {
          setErrors(prev => ({
            ...prev,
            [field]: fieldError
          }));
        }
      }
    }
  }, [formData]);

  // Validar todo el formulario
  const validateForm = useCallback((): boolean => {
    try {
      registerSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        const newErrors: FormErrors = {};
        
        error.errors.forEach(err => {
          const path = err.path[0] as string;
          if (!newErrors[path]) {
            newErrors[path] = err.message;
          }
        });
        
        setErrors(newErrors);
      }
      return false;
    }
  }, [formData]);

  // Limpiar errores
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Resetear formulario
  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setErrors({});
  }, []);

  // Verificar si el formulario es válido (sin mostrar errores)
  const isValid = useCallback(() => {
    try {
      registerSchema.parse(formData);
      return true;
    } catch {
      return false;
    }
  }, [formData])();

  return {
    formData,
    errors,
    isValid,
    updateField,
    validateField,
    validateForm,
    clearErrors,
    resetForm,
  };
};