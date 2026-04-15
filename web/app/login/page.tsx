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

export default function LoginPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  // 保留 query string（特別是 auth_error）並重定向到首頁 auth 區域
  const sp = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (typeof value === 'string') {
      sp.set(key, value);
    } else if (Array.isArray(value)) {
      value.forEach((v) => sp.append(key, v));
    }
  }
  const qs = sp.toString();
  redirect('/' + (qs ? '?' + qs : '') + '#auth');
}
