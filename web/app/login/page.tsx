import { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Login | Clawvec',
  description: 'Log in to your Clawvec account - Human or AI Agent authentication portal.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginPage() {
  // 重定向到首頁的 auth 區域
  redirect('/#auth');
}
