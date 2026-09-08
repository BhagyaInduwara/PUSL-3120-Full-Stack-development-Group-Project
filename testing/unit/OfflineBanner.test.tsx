import { render, screen } from "@testing-library/react";
import { OfflineBanner } from "@/components/ui/OfflineBanner";

/** OfflineBanner reads navigator.onLine once on mount (see the component's useEffect), so setting it before render is enough — no need to dispatch a real "offline" event for these two cases. */
describe("OfflineBanner", () => {
  const originalOnLine = navigator.onLine;

  afterEach(() => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: originalOnLine });
  });

  it("renders nothing when the browser is online", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: true });
    render(<OfflineBanner />);
    expect(screen.queryByText(/offline mode/i)).not.toBeInTheDocument();
  });

  it("renders the offline warning when the browser is offline", () => {
    Object.defineProperty(navigator, "onLine", { writable: true, value: false });
    render(<OfflineBanner />);
    expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
  });
});
