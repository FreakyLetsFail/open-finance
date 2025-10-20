import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from '@/frontend/components/UserCard';

describe('UserCard Component', () => {
  const mockUser = {
    id: '123',
    name: 'John Doe',
    email: 'john@example.com',
    age: 30
  };

  it('should render user information', () => {
    render(<UserCard {...mockUser} />);

    expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    expect(screen.getByTestId('user-email')).toHaveTextContent('john@example.com');
    expect(screen.getByTestId('user-age')).toHaveTextContent('Age: 30');
  });

  it('should render without age', () => {
    const userWithoutAge = {
      id: '123',
      name: 'Jane Doe',
      email: 'jane@example.com'
    };

    render(<UserCard {...userWithoutAge} />);

    expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Doe');
    expect(screen.queryByTestId('user-age')).not.toBeInTheDocument();
  });

  it('should call onEdit when edit button clicked', () => {
    const handleEdit = jest.fn();

    render(<UserCard {...mockUser} onEdit={handleEdit} />);

    const editButton = screen.getByTestId('edit-button');
    fireEvent.click(editButton);

    expect(handleEdit).toHaveBeenCalledWith('123');
    expect(handleEdit).toHaveBeenCalledTimes(1);
  });

  it('should call onDelete when delete button clicked', () => {
    const handleDelete = jest.fn();

    render(<UserCard {...mockUser} onDelete={handleDelete} />);

    const deleteButton = screen.getByTestId('delete-button');
    fireEvent.click(deleteButton);

    expect(handleDelete).toHaveBeenCalledWith('123');
    expect(handleDelete).toHaveBeenCalledTimes(1);
  });

  it('should not render action buttons when callbacks not provided', () => {
    render(<UserCard {...mockUser} />);

    expect(screen.queryByTestId('edit-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-button')).not.toBeInTheDocument();
  });

  it('should have correct aria labels', () => {
    render(
      <UserCard {...mockUser} onEdit={jest.fn()} onDelete={jest.fn()} />
    );

    expect(screen.getByLabelText('Edit John Doe')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete John Doe')).toBeInTheDocument();
  });

  it('should render with data-testid', () => {
    render(<UserCard {...mockUser} />);

    expect(screen.getByTestId('user-card')).toBeInTheDocument();
  });
});
