import { Head, useForm } from '@inertiajs/react';
import { LoaderCircle } from 'lucide-react';
import { FormEventHandler } from 'react';

import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import AuthLayout from '@/layouts/auth-layout';

export default function VerifyEmail({ status }: { status?: string }) {
    const { post, processing } = useForm({});

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <AuthLayout
            title="تأكيد البريد الإلكتروني"
            description="يرجى تأكيد بريدك الإلكتروني بالنقر على الرابط الذي أرسلناه إليك."
        >
            <Head title="تأكيد البريد الإلكتروني" />

            {status === 'verification-link-sent' && (
                <div className="mb-4 text-center text-sm font-medium text-green-600">
                    تم إرسال رابط تحقق جديد إلى بريدك الإلكتروني.
                </div>
            )}

            <form onSubmit={submit} className="space-y-6 text-center">
                <Button disabled={processing} variant="secondary">
                    {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                    إعادة إرسال رسالة التحقق
                </Button>

                <TextLink href={route('logout')} method="post" className="mx-auto block text-sm">
                    تسجيل الخروج
                </TextLink>
            </form>
        </AuthLayout>
    );
}
