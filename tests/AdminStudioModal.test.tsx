import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AdminStudioModal } from '../src/components/AdminStudioModal';

describe('AdminStudioModal Mains publisher', () => {
  it('opens on the requested tab when the modal becomes visible', async () => {
    const props = {
      onClose: vi.fn(),
      onPublishMainsQuestion: vi.fn().mockResolvedValue(undefined),
    };
    const { rerender } = render(
      <AdminStudioModal {...props} open={false} initialTab="quiz" />
    );

    rerender(<AdminStudioModal {...props} open initialTab="mains" />);

    expect(await screen.findByText('Create a Mains writing prompt')).toBeTruthy();
  });

  it('publishes the question settings and answer framework', async () => {
    const onPublishMainsQuestion = vi.fn().mockResolvedValue(undefined);
    render(
      <AdminStudioModal
        open
        initialTab="mains"
        onClose={vi.fn()}
        onPublishMainsQuestion={onPublishMainsQuestion}
      />
    );

    fireEvent.change(screen.getByLabelText('Question title'), {
      target: { value: 'Cooperative federalism' },
    });
    fireEvent.change(screen.getByLabelText('GS paper'), {
      target: { value: 'GS-3' },
    });
    fireEvent.change(screen.getByLabelText('Marks'), {
      target: { value: '15' },
    });
    fireEvent.change(screen.getByLabelText('Subject'), {
      target: { value: 'Governance' },
    });
    fireEvent.change(screen.getByLabelText('Question prompt'), {
      target: { value: 'Examine the role of cooperative federalism.' },
    });
    fireEvent.change(screen.getByLabelText('Suggested introduction'), {
      target: { value: 'Define cooperative federalism.' },
    });
    fireEvent.change(screen.getByLabelText('Analytical dimensions (one per line)'), {
      target: { value: 'Fiscal relations\nInter-state coordination' },
    });
    fireEvent.change(screen.getByLabelText('Statutory or data anchors (one per line)'), {
      target: { value: 'Article 263\nInter-State Council' },
    });
    fireEvent.change(screen.getByLabelText('Way forward (one point per line)'), {
      target: { value: 'Strengthen institutional dialogue' },
    });
    fireEvent.change(screen.getByLabelText('Suggested conclusion'), {
      target: { value: 'Conclude with cooperative federalism.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Publish Mains Question' }));

    await waitFor(() => expect(onPublishMainsQuestion).toHaveBeenCalledOnce());
    expect(onPublishMainsQuestion).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Cooperative federalism',
        gsPaper: 'GS-3',
        subject: 'Governance',
        marks: 15,
        wordLimit: 250,
        suggestedTimeMin: 11,
        framework: {
          intro: 'Define cooperative federalism.',
          dimensions: [{
            title: 'Key analytical dimensions',
            points: ['Fiscal relations', 'Inter-state coordination'],
          }],
          statutoryOrDataRefs: ['Article 263', 'Inter-State Council'],
          wayForward: ['Strengthen institutional dialogue'],
          conclusion: 'Conclude with cooperative federalism.',
        },
      })
    );
    expect((await screen.findByRole('status')).textContent).toContain('Mains question published.');
  });
});
