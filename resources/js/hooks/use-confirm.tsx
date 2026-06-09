import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AlertTriangle, HelpCircle, Info } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';

export type ConfirmVariant = 'default' | 'destructive' | 'warning';

export interface ConfirmOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: ConfirmVariant;
}

export interface AlertOptions {
    title: string;
    description?: string;
    confirmLabel?: string;
    variant?: 'default' | 'warning' | 'destructive';
}

interface DialogState {
    open: boolean;
    mode: 'confirm' | 'alert';
    title: string;
    description?: string;
    confirmLabel: string;
    cancelLabel: string;
    variant: ConfirmVariant;
}

interface ConfirmContextValue {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    alert: (options: AlertOptions) => Promise<void>;
}

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

const initialState: DialogState = {
    open: false,
    mode: 'confirm',
    title: '',
    description: undefined,
    confirmLabel: 'تأكيد',
    cancelLabel: 'إلغاء',
    variant: 'default',
};

function variantIcon(variant: ConfirmVariant) {
    switch (variant) {
        case 'destructive':
            return AlertTriangle;
        case 'warning':
            return AlertTriangle;
        default:
            return HelpCircle;
    }
}

function variantIconClass(variant: ConfirmVariant): string {
    switch (variant) {
        case 'destructive':
            return 'bg-destructive/10 text-destructive ring-destructive/20';
        case 'warning':
            return 'bg-warning/10 text-warning ring-warning/20';
        default:
            return 'bg-primary/10 text-primary ring-primary/20';
    }
}

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<DialogState>(initialState);
    const resolverRef = useRef<((value: boolean) => void) | null>(null);
    const modeRef = useRef<'confirm' | 'alert'>('confirm');

    const close = useCallback((confirmed: boolean) => {
        setState((current) => ({ ...current, open: false }));

        if (resolverRef.current) {
            resolverRef.current(modeRef.current === 'alert' ? true : confirmed);
        }

        resolverRef.current = null;
    }, []);

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            modeRef.current = 'confirm';
            resolverRef.current = resolve;
            setState({
                open: true,
                mode: 'confirm',
                title: options.title,
                description: options.description,
                confirmLabel: options.confirmLabel ?? 'تأكيد',
                cancelLabel: options.cancelLabel ?? 'إلغاء',
                variant: options.variant ?? 'default',
            });
        });
    }, []);

    const alert = useCallback((options: AlertOptions): Promise<void> => {
        return new Promise((resolve) => {
            modeRef.current = 'alert';
            resolverRef.current = () => resolve();
            setState({
                open: true,
                mode: 'alert',
                title: options.title,
                description: options.description,
                confirmLabel: options.confirmLabel ?? 'حسناً',
                cancelLabel: 'إلغاء',
                variant: options.variant ?? 'default',
            });
        });
    }, []);

    const value = useMemo(() => ({ confirm, alert }), [confirm, alert]);

    const Icon = state.mode === 'alert' && state.variant === 'default' ? Info : variantIcon(state.variant);

    return (
        <ConfirmContext.Provider value={value}>
            {children}

            <Dialog
                open={state.open}
                onOpenChange={(open) => {
                    if (!open) {
                        close(false);
                    }
                }}
            >
                <DialogContent dir="rtl" className="gap-0 p-0 sm:max-w-md">
                    <div className="space-y-4 p-6">
                        <DialogHeader className="items-center space-y-4 text-center sm:items-center sm:text-center">
                            <div
                                className={cn(
                                    'flex size-12 items-center justify-center rounded-full ring-1',
                                    variantIconClass(state.variant),
                                )}
                            >
                                <Icon className="size-6" />
                            </div>
                            <div className="space-y-2">
                                <DialogTitle className="text-center text-lg">{state.title}</DialogTitle>
                                {state.description && (
                                    <DialogDescription className="text-center leading-relaxed">{state.description}</DialogDescription>
                                )}
                            </div>
                        </DialogHeader>

                        <DialogFooter className="flex-row gap-2 sm:justify-center">
                            {state.mode === 'confirm' && (
                                <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={() => close(false)}>
                                    {state.cancelLabel}
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant={state.variant === 'destructive' ? 'destructive' : state.variant === 'warning' ? 'outline' : 'default'}
                                className={cn(
                                    'flex-1 sm:flex-none',
                                    state.variant === 'warning' && 'border-warning/30 text-warning hover:bg-warning/10',
                                )}
                                onClick={() => close(true)}
                            >
                                {state.confirmLabel}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmContextValue {
    const context = useContext(ConfirmContext);

    if (!context) {
        throw new Error('useConfirm must be used within ConfirmDialogProvider');
    }

    return context;
}
