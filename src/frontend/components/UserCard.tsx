import React from 'react';

export interface UserCardProps {
  id?: string;
  name: string;
  email: string;
  age?: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const UserCard: React.FC<UserCardProps> = ({
  id,
  name,
  email,
  age,
  onEdit,
  onDelete
}) => {
  return (
    <div className="user-card" data-testid="user-card">
      <h3 data-testid="user-name">{name}</h3>
      <p data-testid="user-email">{email}</p>
      {age && <p data-testid="user-age">Age: {age}</p>}

      <div className="actions">
        {onEdit && id && (
          <button
            data-testid="edit-button"
            onClick={() => onEdit(id)}
            aria-label={`Edit ${name}`}
          >
            Edit
          </button>
        )}
        {onDelete && id && (
          <button
            data-testid="delete-button"
            onClick={() => onDelete(id)}
            aria-label={`Delete ${name}`}
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};
