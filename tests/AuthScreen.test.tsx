import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from '../src/components/AuthScreen';

describe('AuthScreen cloud configuration state', () => {
  it('explains missing production cloud auth and keeps the sandbox available', () => {
    render(
      <AuthScreen
        onSignIn={vi.fn()}
        onSignUp={vi.fn()}
        onMagicLink={vi.fn()}
        onGoogleSignIn={vi.fn()}
        onPasswordReset={vi.fn()}
        onEnterSandbox={vi.fn()}
        cloudAuthAvailable={false}
      />
    );

    expect(screen.getByRole('alert').textContent).toContain('Cloud authentication is not configured');
    expect(screen.getByRole('button', { name: /Sign In to Option A/ }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: /Switch to Option B: Offline Sandbox/ }).hasAttribute('disabled')).toBe(false);
  });
});
