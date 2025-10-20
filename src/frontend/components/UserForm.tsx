import React, { useState } from 'react';

export interface UserFormData {
  name: string;
  email: string;
  age?: number;
}

export interface UserFormProps {
  initialData?: UserFormData;
  onSubmit: (data: UserFormData) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<UserFormData>(
    initialData || { name: '', email: '', age: undefined }
  );
  const [errors, setErrors] = useState<Partial<UserFormData>>({});

  const validate = (): boolean => {
    const newErrors: Partial<UserFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (formData.age && (formData.age < 18 || formData.age > 150)) {
      newErrors.age = 'Age must be between 18 and 150';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      await onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} data-testid="user-form">
      <div className="form-group">
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          data-testid="name-input"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          disabled={isLoading}
        />
        {errors.name && (
          <span className="error" data-testid="name-error">
            {errors.name}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          data-testid="email-input"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />
        {errors.email && (
          <span className="error" data-testid="email-error">
            {errors.email}
          </span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="age">Age (optional)</label>
        <input
          id="age"
          type="number"
          data-testid="age-input"
          value={formData.age || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              age: e.target.value ? parseInt(e.target.value) : undefined
            })
          }
          disabled={isLoading}
        />
        {errors.age && (
          <span className="error" data-testid="age-error">
            {errors.age}
          </span>
        )}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          data-testid="submit-button"
          disabled={isLoading}
        >
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
        {onCancel && (
          <button
            type="button"
            data-testid="cancel-button"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
