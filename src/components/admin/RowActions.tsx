import React from 'react';
import { CopyIcon, PencilIcon, Trash2Icon } from 'lucide-react';

interface RowActionsProps {
  onEdit?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
}

/** Iconos de acción estándar por fila: editar, duplicar, mover a la papelera. */
export function RowActions({ onEdit, onDuplicate, onDelete }: RowActionsProps) {
  return <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
      {onEdit ? <button type="button" onClick={onEdit} aria-label="Editar" className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
          <PencilIcon size={15} />
        </button> : null}
      {onDuplicate ? <button type="button" onClick={onDuplicate} aria-label="Duplicar" className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-brand-soft hover:text-brand">
          <CopyIcon size={15} />
        </button> : null}
      {onDelete ? <button type="button" onClick={onDelete} aria-label="Mover a la papelera" className="rounded-lg p-1.5 text-ink-muted transition-colors duration-150 ease-emphasis hover:bg-rose-50 hover:text-rose-700">
          <Trash2Icon size={15} />
        </button> : null}
    </div>;
}
