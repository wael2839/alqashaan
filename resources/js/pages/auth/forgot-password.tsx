import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, LoaderCircle, Mail } from 'lucide-react';
import { FormEventHandler } from 'react';

import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthLayout from '@/layouts/auth-layout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('password.email'));
    };

    return (
        <AuthLayout
            title="نسيت كلمة المرور"
            description="أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور"
        >
            <Head title="نسيت كلمة المرور" />

            {status && (
                <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700">
                    {status}
                </div>
            )}

            <form className="flex flex-col gap-5" onSubmit={submit}>
                <div className="grid gap-2">
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <div className="relative">
                        <Mail className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            required
                            autoFocus
                            tabIndex={1}
                            autoComplete="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            placeholder="admin@example.com"
                            className="ps-10"
                            dir="ltr"
                        />
                    </div>
                    <InputError message={errors.email} />
                </div>

                <Button type="submit" className="w-full" size="lg" tabIndex={2} disabled={processing}>
                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                    إرسال رابط إعادة التعيين
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                <TextLink href={route('login')} className="inline-flex items-center gap-1.5 font-medium text-primary no-underline hover:underline" tabIndex={3}>
                    <ArrowRight className="size-4" />
                    العودة لتسجيل الدخول
                </TextLink>
            </p>
        </AuthLayout>
    );
}
