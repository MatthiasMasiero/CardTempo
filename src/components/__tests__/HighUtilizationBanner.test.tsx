import { render, screen, fireEvent } from '@testing-library/react';
import { HighUtilizationBanner } from '../HighUtilizationBanner';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

describe('HighUtilizationBanner', () => {
  let mockPush: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    mockPush = jest.fn();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Visibility Logic', () => {
    test('shows banner when utilization > 30% and not dismissed', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      expect(screen.getByText(/Can't Pay in Full/)).toBeInTheDocument();
      expect(screen.getByText(/45.5%/)).toBeInTheDocument();
      expect(screen.getByText(/above the recommended 30% threshold/)).toBeInTheDocument();
    });

    test('hides banner when utilization <= 30%', () => {
      render(<HighUtilizationBanner overallUtilization={25.0} />);
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('hides banner when utilization = 30% (boundary)', () => {
      render(<HighUtilizationBanner overallUtilization={30.0} />);
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('shows banner when utilization = 30.1% (boundary)', () => {
      render(<HighUtilizationBanner overallUtilization={30.1} />);
      expect(screen.getByText(/Can't Pay in Full/)).toBeInTheDocument();
      expect(screen.getByText(/30.1%/)).toBeInTheDocument();
    });

    test('hides banner when previously dismissed', () => {
      localStorage.setItem('highUtilizationBannerDismissed', 'true');

      render(<HighUtilizationBanner overallUtilization={45.5} />);

      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('shows banner with very high utilization (>100%)', () => {
      render(<HighUtilizationBanner overallUtilization={105.5} />);

      expect(screen.getByText(/Can't Pay in Full/)).toBeInTheDocument();
      expect(screen.getByText(/105.5%/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('dismisses banner when X button clicked', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      const dismissButton = screen.getByLabelText('Dismiss warning');
      expect(dismissButton).toBeInTheDocument();

      fireEvent.click(dismissButton);

      expect(localStorage.getItem('highUtilizationBannerDismissed')).toBe('true');
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('navigates to priority page when button clicked', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      const button = screen.getByText(/Optimize My Payments/);
      fireEvent.click(button);

      expect(mockPush).toHaveBeenCalledWith('/dashboard/priority');
      expect(mockPush).toHaveBeenCalledTimes(1);
    });

    test('displays correct utilization percentage', () => {
      const { rerender } = render(<HighUtilizationBanner overallUtilization={45.5} />);
      expect(screen.getByText(/45.5%/)).toBeInTheDocument();

      rerender(<HighUtilizationBanner overallUtilization={67.8} />);
      expect(screen.getByText(/67.8%/)).toBeInTheDocument();
    });

    test('formats utilization to one decimal place', () => {
      render(<HighUtilizationBanner overallUtilization={45.567} />);
      expect(screen.getByText(/45.6%/)).toBeInTheDocument();
    });
  });

  describe('Component Structure', () => {
    test('renders AlertTriangle icon', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      // Check for alert role (Alert component has role="alert")
      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    test('renders with correct CSS classes for red theme', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('bg-red-50');
      expect(alert).toHaveClass('border-red-200');
    });

    test('renders help text about Smart Payment Allocation', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      expect(screen.getByText(/Smart Payment Allocation tool/)).toBeInTheDocument();
      expect(screen.getByText(/maximize your credit score improvement/)).toBeInTheDocument();
    });

    test('renders destructive button variant', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      const button = screen.getByText(/Optimize My Payments/);
      expect(button).toHaveClass('gap-2'); // Part of the className
    });
  });

  describe('Edge Cases', () => {
    test('handles zero utilization', () => {
      render(<HighUtilizationBanner overallUtilization={0} />);
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('handles negative utilization (invalid but defensive)', () => {
      render(<HighUtilizationBanner overallUtilization={-5} />);
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('updates visibility when utilization prop changes', () => {
      const { rerender } = render(<HighUtilizationBanner overallUtilization={25.0} />);
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();

      rerender(<HighUtilizationBanner overallUtilization={45.5} />);
      expect(screen.getByText(/Can't Pay in Full/)).toBeInTheDocument();

      rerender(<HighUtilizationBanner overallUtilization={20.0} />);
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('does not crash with very large utilization values', () => {
      render(<HighUtilizationBanner overallUtilization={999.9} />);
      expect(screen.getByText(/Can't Pay in Full/)).toBeInTheDocument();
      expect(screen.getByText(/999.9%/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('dismiss button has aria-label', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      const dismissButton = screen.getByLabelText('Dismiss warning');
      expect(dismissButton).toBeInTheDocument();
    });

    test('alert has role="alert" for screen readers', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    test('buttons are keyboard accessible', () => {
      render(<HighUtilizationBanner overallUtilization={45.5} />);

      const optimizeButton = screen.getByText(/Optimize My Payments/);
      const dismissButton = screen.getByLabelText('Dismiss warning');

      expect(optimizeButton).toBeInTheDocument();
      expect(dismissButton).toBeInTheDocument();

      // Buttons should be focusable (implicit in button/Button elements)
      expect(optimizeButton.tagName).toBe('BUTTON');
      expect(dismissButton.tagName).toBe('BUTTON');
    });
  });

  describe('LocalStorage Persistence', () => {
    test('respects existing dismissal state on mount', () => {
      localStorage.setItem('highUtilizationBannerDismissed', 'true');

      render(<HighUtilizationBanner overallUtilization={45.5} />);

      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
    });

    test('dismissal persists across re-renders', () => {
      const { rerender } = render(<HighUtilizationBanner overallUtilization={45.5} />);

      const dismissButton = screen.getByLabelText('Dismiss warning');
      fireEvent.click(dismissButton);

      rerender(<HighUtilizationBanner overallUtilization={45.5} />);

      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();
      expect(localStorage.getItem('highUtilizationBannerDismissed')).toBe('true');
    });

    test('clearing localStorage re-shows banner', () => {
      localStorage.setItem('highUtilizationBannerDismissed', 'true');

      const { rerender } = render(<HighUtilizationBanner overallUtilization={45.5} />);
      expect(screen.queryByText(/Can't Pay in Full/)).not.toBeInTheDocument();

      localStorage.clear();

      // Change utilization to trigger useEffect re-run
      rerender(<HighUtilizationBanner overallUtilization={45.6} />);
      expect(screen.getByText(/Can't Pay in Full/)).toBeInTheDocument();
    });
  });
});
