import React, { useState, useRef, useEffect } from 'react';
import { PencilIcon, CopyIcon, Trash2Icon, MoreHorizontalIcon, EyeIcon, ToggleLeftIcon, ToggleRightIcon } from 'lucide-react';

export interface RowAction {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
}

interface RowActionsProps {
  onEdit?:      () => void;
  onDuplicate?: () => void;
  onDelete?:    () => void;
  onView?:      () => void;
  onToggle?:    () => void;
  toggleActive?: boolean;
  extra?: RowAction[];
}

export function RowActions({ onEdit, onDuplicate, onDelete, onView, onToggle, toggleActive, extra }: RowActionsProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const actions: RowAction[] = [
    ...(onView      ? [{ label: 'Ver detalle',  icon: EyeIcon,          onClick: onView,      variant: 'default' as const }] : []),
    ...(onEdit      ? [{ label: 'Editar',        icon: PencilIcon,       onClick: onEdit,      variant: 'default' as const }] : []),
    ...(onToggle    ? [{ label: toggleActive ? 'Desactivar' : 'Activar', icon: toggleActive ? ToggleRightIcon : ToggleLeftIcon, onClick: onToggle, variant: 'default' as const }] : []),
    ...(onDuplicate ? [{ label: 'Duplicar',      icon: CopyIcon,         onClick: onDuplicate, variant: 'default' as const, divider: true }] : []),
    ...(extra ?? []),
    ...(onDelete    ? [{ label: 'Eliminar',      icon: Trash2Icon,       onClick: onDelete,    variant: 'danger'  as const, divider: !extra?.length && !!onDuplicate }] : []),
  ];

  return (
    <div ref={ref} className="relative flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
      {/* Botones rápidos siempre visibles */}
      {onEdit && (
        <ActionBtn icon={PencilIcon} title="Editar" onClick={onEdit} />
      )}
      {onDuplicate && (
        <ActionBtn icon={CopyIcon} title="Duplicar" onClick={onDuplicate} />
      )}
      {/* Menú más opciones */}
      {(onDelete || onView || onToggle || extra?.length) && (
        <div className="relative">
          <ActionBtn icon={MoreHorizontalIcon} title="Más acciones" onClick={() => setOpen(o => !o)} active={open} />
          {open && (
            <div
              className="absolute right-0 top-8 z-30 overflow-hidden rounded-xl py-1 min-w-[160px]"
              style={{ background: '#182d47', border: '1px solid #1e3450', boxShadow: '0 8px 24px rgba(0,0,0,.5)' }}
            >
              {actions.map((action, i) => (
                <React.Fragment key={i}>
                  {action.divider && i > 0 && (
                    <div className="my-1" style={{ borderTop: '1px solid #1e3450' }} />
                  )}
                  <button
                    type="button"
                    onClick={() => { action.onClick(); setOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2 text-sm transition-colors"
                    style={{ color: action.variant === 'danger' ? '#F24463' : '#7A9CB8' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1e3450')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <action.icon size={13} />
                    {action.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionBtn({ icon: Icon, title, onClick, active }: {
  icon: React.ElementType; title: string; onClick: () => void; active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={e => { e.stopPropagation(); onClick(); }}
      className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
      style={{
        background: active ? '#1e3450' : 'transparent',
        color: '#3A5470',
        border: '1px solid transparent',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = '#1e3450'; e.currentTarget.style.color = '#E1EAF4'; e.currentTarget.style.borderColor = '#2a4a6b'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#3A5470'; e.currentTarget.style.borderColor = 'transparent'; }}
    >
      <Icon size={13} />
    </button>
  );
}
