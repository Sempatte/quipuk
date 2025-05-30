// hooks/useTransactionForm.ts
import { useState, useCallback, useMemo } from 'react';
import { TransactionOption, TRANSACTION_MAPPING } from '@/app/interfaces/transaction.interface';

export interface FormState {
  selectedOption: TransactionOption;
  amount: string;
  description: string;
  category: string;
  paymentmethod: string;
  date: string;
  dueDate: string;
  frequent: boolean;
  isPaid: boolean;
}

export interface FormValidation {
  isValid: boolean;
  errors: string[];
  fieldValidation: {
    amount: boolean;
    category: boolean;
    paymentmethod: boolean;
  };
}

interface UseTransactionFormOptions {
  initialState?: Partial<FormState>;
  preselectedTab?: TransactionOption;
  forcePaymentStatus?: 'pending' | 'completed';
}

const INITIAL_FORM_STATE: FormState = {
  selectedOption: "Gastos",
  amount: "",
  description: "",
  category: "",
  paymentmethod: "Efectivo",
  date: new Date().toISOString(),
  dueDate: new Date().toISOString(),
  frequent: false,
  isPaid: true,
};

const VALIDATION_RULES = {
  amount: (value: string) => value && parseFloat(value) > 0,
  category: (value: string) => value.length > 0,
  paymentmethod: (value: string) => value.length > 0,
} as const;

export const useTransactionForm = (options: UseTransactionFormOptions = {}) => {
  const { initialState, preselectedTab, forcePaymentStatus } = options;
  
  // 🎯 ESTADO INICIAL CALCULADO
  const [formState, setFormState] = useState<FormState>(() => {
    const defaultDueDate = new Date();
    defaultDueDate.setDate(defaultDueDate.getDate() + 7);
    
    return {
      ...INITIAL_FORM_STATE,
      selectedOption: preselectedTab || INITIAL_FORM_STATE.selectedOption,
      isPaid: forcePaymentStatus !== "pending",
      dueDate: forcePaymentStatus === "pending" ? defaultDueDate.toISOString() : INITIAL_FORM_STATE.dueDate,
      ...initialState,
    };
  });

  // 🎯 ACTUALIZACIÓN OPTIMIZADA DEL ESTADO
  const updateFormState = useCallback((updates: Partial<FormState>) => {
    setFormState(prev => {
      const newState = { ...prev, ...updates };
      
      // 🎯 LÓGICA AUTOMÁTICA PARA FECHAS
      if ('isPaid' in updates) {
        if (!updates.isPaid && prev.date === INITIAL_FORM_STATE.date) {
          const defaultDueDate = new Date();
          defaultDueDate.setDate(defaultDueDate.getDate() + 7);
          newState.dueDate = defaultDueDate.toISOString();
        }
      }
      
      if (__DEV__) {
        console.log("🔄 [useTransactionForm] Estado actualizado:", updates);
      }
      
      return newState;
    });
  }, []);

  // 🎯 VALIDACIÓN REACTIVA
  const validation = useMemo((): FormValidation => {
    const errors: string[] = [];
    const isAmountValid = VALIDATION_RULES.amount(formState.amount);
    const isCategoryValid = VALIDATION_RULES.category(formState.category);
    const isPaymentMethodValid = VALIDATION_RULES.paymentmethod(formState.paymentmethod);
    
    if (!isAmountValid) errors.push("Monto requerido");
    if (!isCategoryValid) errors.push("Categoría requerida");
    if (!isPaymentMethodValid) errors.push("Método de pago requerido");
    
    return {
      isValid: errors.length === 0,
      errors,
      fieldValidation: {
        amount: Boolean(isAmountValid),
        category: Boolean(isCategoryValid), 
        paymentmethod: Boolean(isPaymentMethodValid),
      }
    };
  }, [formState.amount, formState.category, formState.paymentmethod]);

  // 🎯 RESETEAR FORMULARIO
  const resetForm = useCallback((keepOption = false) => {
    setFormState(prev => ({
      ...INITIAL_FORM_STATE,
      selectedOption: keepOption ? prev.selectedOption : INITIAL_FORM_STATE.selectedOption,
    }));
  }, []);

  // 🎯 APLICAR DATOS DE OCR
  const applyOCRData = useCallback((data: {
    amount?: number;
    description?: string;
    category?: string;
    paymentmethod?: string;
    date?: string;
    merchantName?: string;
  }) => {
    const updates: Partial<FormState> = {};
    let fieldsUpdated = 0;

    if (data.amount && data.amount > 0) {
      updates.amount = data.amount.toString();
      fieldsUpdated++;
    }

    if (data.description?.trim()) {
      updates.description = data.description.trim();
      fieldsUpdated++;
    }

    if (data.category?.trim()) {
      updates.category = data.category.trim();
      fieldsUpdated++;
    }

    if (data.paymentmethod?.trim()) {
      updates.paymentmethod = data.paymentmethod.trim();
      fieldsUpdated++;
    }

    if (data.date) {
      try {
        const extractedDate = new Date(data.date);
        if (!isNaN(extractedDate.getTime())) {
          const dateField = formState.isPaid ? 'date' : 'dueDate';
          updates[dateField] = extractedDate.toISOString();
          fieldsUpdated++;
        }
      } catch (error) {
        console.warn("Error procesando fecha OCR:", error);
      }
    }

    // Aplicar merchant name si no hay descripción
    if (data.merchantName && !updates.description && !formState.description) {
      updates.description = `Compra en ${data.merchantName}`;
      fieldsUpdated++;
    }

    if (fieldsUpdated > 0) {
      updateFormState(updates);
    }

    return fieldsUpdated;
  }, [formState.isPaid, formState.description, updateFormState]);

  // 🎯 PREPARAR DATOS PARA ENVÍO
  const prepareTransactionData = useCallback((userId: number) => {
    const amount = parseFloat(formState.amount);
    
    if (isNaN(amount) || amount <= 0) {
      throw new Error("El monto debe ser un número válido mayor a 0");
    }

    return {
      userId,
      title: formState.category,
      description: formState.description || `${formState.selectedOption} en ${formState.category}`,
      amount,
      type: TRANSACTION_MAPPING[formState.selectedOption],
      frequent: formState.frequent,
      paymentmethod: formState.paymentmethod,
      category: formState.category,
      status: formState.isPaid ? "completed" as const : "pending" as const,
      dueDate: new Date(formState.isPaid ? formState.date : formState.dueDate),
    };
  }, [formState]);

  // 🎯 HANDLERS ESPECÍFICOS
  const handleSliderChange = useCallback((selectedOption: TransactionOption) => {
    updateFormState({ selectedOption });
  }, [updateFormState]);

  const handleStatusChange = useCallback((isPaid: boolean, statusReadOnly = false) => {
    if (statusReadOnly) return;
    updateFormState({ isPaid });
  }, [updateFormState]);

  const handleFrequentSelection = useCallback((item: {
    amount: string;
    description?: string;
    title: string;
  }) => {
    updateFormState({
      amount: item.amount.replace("S/ ", ""),
      description: item.description || "",
      category: item.title,
      frequent: true,
    });
  }, [updateFormState]);

  return {
    // Estado
    formState,
    validation,
    
    // Funciones de actualización
    updateFormState,
    resetForm,
    applyOCRData,
    prepareTransactionData,
    
    // Handlers específicos
    handleSliderChange,
    handleStatusChange,
    handleFrequentSelection,
    
    // Computed values
    isValid: validation.isValid,
    errors: validation.errors,
    transactionType: TRANSACTION_MAPPING[formState.selectedOption],
  };
};