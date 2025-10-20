import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserForm } from '@/frontend/components/UserForm';

describe('UserForm Component', () => {
  const mockSubmit = jest.fn();
  const mockCancel = jest.fn();

  beforeEach(() => {
    mockSubmit.mockClear();
    mockCancel.mockClear();
  });

  it('should render empty form', () => {
    render(<UserForm onSubmit={mockSubmit} />);

    expect(screen.getByTestId('name-input')).toHaveValue('');
    expect(screen.getByTestId('email-input')).toHaveValue('');
    expect(screen.getByTestId('age-input')).toHaveValue(null);
  });

  it('should render with initial data', () => {
    const initialData = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };

    render(<UserForm initialData={initialData} onSubmit={mockSubmit} />);

    expect(screen.getByTestId('name-input')).toHaveValue('John Doe');
    expect(screen.getByTestId('email-input')).toHaveValue('john@example.com');
    expect(screen.getByTestId('age-input')).toHaveValue(30);
  });

  it('should validate required fields', async () => {
    render(<UserForm onSubmit={mockSubmit} />);

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toBeInTheDocument();
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
    });

    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should validate name length', async () => {
    render(<UserForm onSubmit={mockSubmit} />);

    const nameInput = screen.getByTestId('name-input');
    await userEvent.type(nameInput, 'J');

    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'test@example.com');

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toHaveTextContent(
        'Name must be at least 2 characters'
      );
    });
  });

  it('should validate email format', async () => {
    render(<UserForm onSubmit={mockSubmit} />);

    const nameInput = screen.getByTestId('name-input');
    await userEvent.type(nameInput, 'John Doe');

    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'invalid-email');

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Invalid email format'
      );
    });
  });

  it('should validate age range', async () => {
    render(<UserForm onSubmit={mockSubmit} />);

    const nameInput = screen.getByTestId('name-input');
    await userEvent.type(nameInput, 'John Doe');

    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'john@example.com');

    const ageInput = screen.getByTestId('age-input');
    await userEvent.type(ageInput, '15');

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('age-error')).toHaveTextContent(
        'Age must be between 18 and 150'
      );
    });
  });

  it('should submit valid form', async () => {
    render(<UserForm onSubmit={mockSubmit} />);

    const nameInput = screen.getByTestId('name-input');
    await userEvent.type(nameInput, 'John Doe');

    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'john@example.com');

    const ageInput = screen.getByTestId('age-input');
    await userEvent.type(ageInput, '30');

    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        age: 30
      });
    });
  });

  it('should handle cancel button', () => {
    render(<UserForm onSubmit={mockSubmit} onCancel={mockCancel} />);

    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    expect(mockCancel).toHaveBeenCalled();
    expect(mockSubmit).not.toHaveBeenCalled();
  });

  it('should disable inputs when loading', () => {
    render(<UserForm onSubmit={mockSubmit} isLoading={true} />);

    expect(screen.getByTestId('name-input')).toBeDisabled();
    expect(screen.getByTestId('email-input')).toBeDisabled();
    expect(screen.getByTestId('age-input')).toBeDisabled();
    expect(screen.getByTestId('submit-button')).toBeDisabled();
  });

  it('should show loading state on submit button', () => {
    render(<UserForm onSubmit={mockSubmit} isLoading={true} />);

    expect(screen.getByTestId('submit-button')).toHaveTextContent('Submitting...');
  });

  it('should not show cancel button when onCancel not provided', () => {
    render(<UserForm onSubmit={mockSubmit} />);

    expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument();
  });

  it('should clear errors on valid input', async () => {
    render(<UserForm onSubmit={mockSubmit} />);

    // Submit to trigger errors
    const submitButton = screen.getByTestId('submit-button');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toBeInTheDocument();
    });

    // Enter valid name
    const nameInput = screen.getByTestId('name-input');
    await userEvent.type(nameInput, 'John Doe');

    const emailInput = screen.getByTestId('email-input');
    await userEvent.type(emailInput, 'john@example.com');

    // Submit again
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByTestId('name-error')).not.toBeInTheDocument();
      expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
    });
  });
});
