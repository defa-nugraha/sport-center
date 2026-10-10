import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
    Check,
    CheckCircle2,
    ChevronDown,
    CircleAlert,
    Trash2,
} from 'lucide-react';
import { ReactNode } from 'react';

export function CmsModal({
    open,
    onOpenChange,
    title,
    description,
    size = 'md',
    children,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    size?: 'sm' | 'md' | 'lg';
    children: ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className={`cms-modal cms-modal-${size}`}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}

export function CmsSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Pilih opsi',
    name,
}: {
    value?: string;
    onValueChange?: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
    name?: string;
}) {
    return (
        <Select name={name} value={value || ''} onValueChange={onValueChange}>
            <SelectTrigger className="cms-select-trigger">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent className="cms-select-content">
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export function CmsMultiSelect({
    values,
    onChange,
    options,
    placeholder = 'Pilih beberapa opsi',
}: {
    values: number[];
    onChange: (values: number[]) => void;
    options: { value: number; label: string }[];
    placeholder?: string;
}) {
    const selected = options.filter((option) => values.includes(option.value));
    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger className="cms-multiselect" type="button">
                <span>
                    {selected.length
                        ? selected.map((option) => option.label).join(', ')
                        : placeholder}
                </span>
                <ChevronDown aria-hidden="true" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="cms-multiselect-content"
                    sideOffset={5}
                >
                    {options.map((option) => (
                        <DropdownMenu.CheckboxItem
                            key={option.value}
                            checked={values.includes(option.value)}
                            onCheckedChange={(checked) =>
                                onChange(
                                    checked
                                        ? [...values, option.value]
                                        : values.filter(
                                              (value) => value !== option.value,
                                          ),
                                )
                            }
                            className="cms-multiselect-item"
                            onSelect={(event) => event.preventDefault()}
                        >
                            <DropdownMenu.ItemIndicator>
                                <Check aria-hidden="true" />
                            </DropdownMenu.ItemIndicator>
                            {option.label}
                        </DropdownMenu.CheckboxItem>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}

export function ConfirmDialog({
    open,
    onOpenChange,
    itemName,
    onConfirm,
    processing,
    title = 'Hapus data ini?',
    description,
    confirmLabel = 'Ya, hapus',
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName?: string;
    onConfirm: () => void;
    processing?: boolean;
    title?: string;
    description?: string;
    confirmLabel?: string;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="cms-modal cms-modal-sm">
                <DialogHeader>
                    <div className="modal-icon danger">
                        <Trash2 aria-hidden="true" />
                    </div>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        {description || (itemName
                            ? `“${itemName}” akan dihapus dan tidak lagi tampil di situs.`
                            : 'Data ini akan dihapus dan tidak lagi tampil di situs.')}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose className="button secondary" type="button">
                        Batal
                    </DialogClose>
                    <button
                        className="button danger"
                        type="button"
                        onClick={onConfirm}
                        disabled={processing}
                    >
                        {processing ? 'Memproses...' : confirmLabel}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function StatusDialog({
    open,
    onOpenChange,
    type,
    message,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'success' | 'error';
    message: string;
}) {
    const Icon = type === 'success' ? CheckCircle2 : CircleAlert;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="cms-modal cms-modal-sm status-modal">
                <DialogHeader>
                    <div className={`modal-icon ${type}`}>
                        <Icon aria-hidden="true" />
                    </div>
                    <DialogTitle>
                        {type === 'success'
                            ? 'Berhasil'
                            : 'Aksi belum berhasil'}
                    </DialogTitle>
                    <DialogDescription>{message}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose className="button" type="button">
                        Tutup
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
