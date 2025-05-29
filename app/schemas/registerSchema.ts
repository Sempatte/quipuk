// app/schemas/registerSchema.ts
import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z
    .string()
    .min(10, 'El nombre debe tener al menos 10 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')
    .refine(val => val.trim().split(' ').length >= 2, 'Debe incluir nombre y apellido'),
  
  email: z
    .string()
    .email('Ingresa un email válido')
    .min(1, 'El email es obligatorio')
    .refine(val => {
      // Validación más estricta de email
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(val);
    }, 'Formato de email inválido'),
  
  countryCode: z
    .string()
    .min(1, 'Selecciona un país'),
  
  phoneNumber: z
    .string()
    .min(7, 'El teléfono debe tener al menos 7 dígitos')
    .max(15, 'El teléfono no puede exceder 15 dígitos')
    .regex(/^[\d\s-()]+$/, 'Solo se permiten números, espacios, guiones y paréntesis'),
  
  username: z
    .string()
    .min(6, 'El usuario debe tener al menos 6 caracteres')
    .max(20, 'El usuario no puede exceder 20 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'El usuario solo puede contener letras, números y guión bajo')
    .regex(/^[a-zA-Z]/, 'El usuario debe comenzar con una letra'),
  
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  
  confirmPassword: z.string(),
  
  acceptedTerms: z
    .boolean()
    .refine(val => val === true, 'Debes aceptar los términos y condiciones')
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

export type RegisterFormData = z.infer<typeof registerSchema>;