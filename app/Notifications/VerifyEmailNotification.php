<?php

namespace App\Notifications;

use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Notifications\Messages\MailMessage;

class VerifyEmailNotification extends VerifyEmail
{
    public function toMail($notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('تأكيد البريد الإلكتروني')
            ->greeting('مرحباً!')
            ->line('يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني.')
            ->action('تأكيد البريد الإلكتروني', $verificationUrl)
            ->line('إذا لم تقم بإنشاء حساب، فلا حاجة لأي إجراء آخر.')
            ->salutation('مع التحية، '.config('app.name'));
    }
}
