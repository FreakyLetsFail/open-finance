import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UserCard } from '@/frontend/components/UserCard';
import { UserForm } from '@/frontend/components/UserForm';
import { mockFetch } from '../../utils/testHelpers';

// Complete user management flow component
const UserManagementFlow: React.FC = () => {
  const [users, setUsers] = React.useState<any[]>([]);
  const [editing, setEditing] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);

  const handleCreate = async (data: any) => {
    const newUser = { ...data, id: Date.now().toString() };
    setUsers(prev => [...prev, newUser]);
    setCreating(false);
  };

  const handleEdit = (id: string) => {
    setEditing(id);
  };

  const handleUpdate = async (data: any) => {
    setUsers(prev =>
      prev.map(u => (u.id === editing ? { ...u, ...data } : u))
    );
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div>
      <h1>User Management</h1>

      {!creating && !editing && (
        <button
          data-testid="create-new-button"
          onClick={() => setCreating(true)}
        >
          Create New User
        </button>
      )}

      {creating && (
        <div data-testid="create-form">
          <h2>Create User</h2>
          <UserForm
            onSubmit={handleCreate}
            onCancel={() => setCreating(false)}
          />
        </div>
      )}

      {editing && (
        <div data-testid="edit-form">
          <h2>Edit User</h2>
          <UserForm
            initialData={users.find(u => u.id === editing)}
            onSubmit={handleUpdate}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      <div data-testid="user-list">
        {users.length === 0 && <p>No users found</p>}
        {users.map(user => (
          <UserCard
            key={user.id}
            {...user}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
};

describe('User Management Flow Integration', () => {
  it('should complete full user creation flow', async () => {
    const user = userEvent.setup();
    render(<UserManagementFlow />);

    // Initial state - no users
    expect(screen.getByText('No users found')).toBeInTheDocument();

    // Click create button
    const createButton = screen.getByTestId('create-new-button');
    await user.click(createButton);

    // Fill out form
    const nameInput = screen.getByTestId('name-input');
    const emailInput = screen.getByTestId('email-input');
    const ageInput = screen.getByTestId('age-input');

    await user.type(nameInput, 'John Doe');
    await user.type(emailInput, 'john@example.com');
    await user.type(ageInput, '30');

    // Submit form
    const submitButton = screen.getByTestId('submit-button');
    await user.click(submitButton);

    // Verify user was created
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
      expect(screen.getByTestId('user-email')).toHaveTextContent(
        'john@example.com'
      );
      expect(screen.getByTestId('user-age')).toHaveTextContent('Age: 30');
    });
  });

  it('should complete full user edit flow', async () => {
    const user = userEvent.setup();
    render(<UserManagementFlow />);

    // Create a user first
    await user.click(screen.getByTestId('create-new-button'));
    await user.type(screen.getByTestId('name-input'), 'John Doe');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });

    // Edit the user
    const editButton = screen.getByTestId('edit-button');
    await user.click(editButton);

    // Verify edit form appears with existing data
    await waitFor(() => {
      expect(screen.getByTestId('edit-form')).toBeInTheDocument();
      expect(screen.getByTestId('name-input')).toHaveValue('John Doe');
    });

    // Update name
    const nameInput = screen.getByTestId('name-input');
    await user.clear(nameInput);
    await user.type(nameInput, 'Jane Doe');

    // Add age
    const ageInput = screen.getByTestId('age-input');
    await user.type(ageInput, '25');

    // Submit
    await user.click(screen.getByTestId('submit-button'));

    // Verify updates
    await waitFor(() => {
      expect(screen.getByTestId('user-name')).toHaveTextContent('Jane Doe');
      expect(screen.getByTestId('user-age')).toHaveTextContent('Age: 25');
    });
  });

  it('should complete full user delete flow', async () => {
    const user = userEvent.setup();
    render(<UserManagementFlow />);

    // Create a user
    await user.click(screen.getByTestId('create-new-button'));
    await user.type(screen.getByTestId('name-input'), 'John Doe');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('user-card')).toBeInTheDocument();
    });

    // Delete the user
    const deleteButton = screen.getByTestId('delete-button');
    await user.click(deleteButton);

    // Verify deletion
    await waitFor(() => {
      expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
  });

  it('should handle form validation during creation', async () => {
    const user = userEvent.setup();
    render(<UserManagementFlow />);

    await user.click(screen.getByTestId('create-new-button'));

    // Try to submit empty form
    await user.click(screen.getByTestId('submit-button'));

    // Verify validation errors
    await waitFor(() => {
      expect(screen.getByTestId('name-error')).toBeInTheDocument();
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
    });

    // Verify no user was created
    expect(screen.queryByTestId('user-card')).not.toBeInTheDocument();
  });

  it('should handle cancel during creation', async () => {
    const user = userEvent.setup();
    render(<UserManagementFlow />);

    await user.click(screen.getByTestId('create-new-button'));
    expect(screen.getByTestId('create-form')).toBeInTheDocument();

    await user.click(screen.getByTestId('cancel-button'));

    // Form should close
    await waitFor(() => {
      expect(screen.queryByTestId('create-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('create-new-button')).toBeInTheDocument();
    });
  });

  it('should handle cancel during edit', async () => {
    const user = userEvent.setup();
    render(<UserManagementFlow />);

    // Create a user
    await user.click(screen.getByTestId('create-new-button'));
    await user.type(screen.getByTestId('name-input'), 'John Doe');
    await user.type(screen.getByTestId('email-input'), 'john@example.com');
    await user.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('user-card')).toBeInTheDocument();
    });

    // Start edit
    await user.click(screen.getByTestId('edit-button'));
    expect(screen.getByTestId('edit-form')).toBeInTheDocument();

    // Cancel edit
    await user.click(screen.getByTestId('cancel-button'));

    // Form should close, user unchanged
    await waitFor(() => {
      expect(screen.queryByTestId('edit-form')).not.toBeInTheDocument();
      expect(screen.getByTestId('user-name')).toHaveTextContent('John Doe');
    });
  });

  it('should manage multiple users', async () => {
    const user = userEvent.setup();
    render(<UserManagementFlow />);

    // Create first user
    await user.click(screen.getByTestId('create-new-button'));
    await user.type(screen.getByTestId('name-input'), 'User 1');
    await user.type(screen.getByTestId('email-input'), 'user1@example.com');
    await user.click(screen.getByTestId('submit-button'));

    // Create second user
    await user.click(screen.getByTestId('create-new-button'));
    await user.type(screen.getByTestId('name-input'), 'User 2');
    await user.type(screen.getByTestId('email-input'), 'user2@example.com');
    await user.click(screen.getByTestId('submit-button'));

    // Create third user
    await user.click(screen.getByTestId('create-new-button'));
    await user.type(screen.getByTestId('name-input'), 'User 3');
    await user.type(screen.getByTestId('email-input'), 'user3@example.com');
    await user.click(screen.getByTestId('submit-button'));

    // Verify all users
    await waitFor(() => {
      const userCards = screen.getAllByTestId('user-card');
      expect(userCards).toHaveLength(3);
    });

    // Delete middle user
    const deleteButtons = screen.getAllByTestId('delete-button');
    await user.click(deleteButtons[1]);

    // Verify remaining users
    await waitFor(() => {
      const userCards = screen.getAllByTestId('user-card');
      expect(userCards).toHaveLength(2);
    });
  });
});
