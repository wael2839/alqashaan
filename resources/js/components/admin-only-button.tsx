import { ButtonHTMLAttributes } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

interface AdminOnlyButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AdminOnlyButton({ children, disabled, ...props }: AdminOnlyButtonProps) {
    const { isAdmin } = useAuth();

    return (
        <Button {...props} disabled={!isAdmin || disabled}>
            {children}
        </Button>
    );
}
