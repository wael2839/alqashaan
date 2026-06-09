<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Notifications\Messages\MailMessage;

class ResetPasswordNotification extends ResetPassword
{
    public function toMail($notifiable): MailMessage
    {
        $expireMinutes = config('auth.passwords.'.config('auth.defaults.passwords').'.expire');

        return (new MailMessage)
            ->subject('إشعار إعادة تعيين كلمة المرور')
            ->greeting('مرحباً!')
            ->line('لقد تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك.')
            ->action('إعادة تعيين كلمة المرور', $this->resetUrl($notifiable))
            ->line("ستنتهي صلاحية رابط إعادة التعيين خلال {$expireMinutes} دقيقة.")
            ->line('إذا لم تطلب إعادة تعيين كلمة المرور، فلا حاجة لأي إجراء آخر.')
            ->salutation('مع التحية، '.config('app.name'));
    }
}
