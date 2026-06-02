import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock next/head
jest.mock('next/head', () => {
  return function MockHead({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
  };
});

describe('Accessibility Tests', () => {
  it('should pass basic axe check on a simple component', async () => {
    const { container } = render(
      <div>
        <h1>Test Page</h1>
        <button aria-label="Close">X</button>
      </div>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
