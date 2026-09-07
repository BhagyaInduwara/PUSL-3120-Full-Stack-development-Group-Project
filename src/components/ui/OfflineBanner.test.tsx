/**
 * @jest-environment jsdom
 */
// @ts-nocheck
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { OfflineBanner } from "./OfflineBanner";

describe("OfflineBanner Component", () => {
  const originalOnLine = navigator.onLine;

  beforeEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: originalOnLine,
    });
  });

  it("does not render when the browser is online", () => {
    render(<OfflineBanner />);
    const banner = screen.queryByText(/offline mode/i);
    expect(banner).not.toBeInTheDocument();
  });

  it("renders the offline warning banner when the browser is offline", () => {
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: false,
    });

    render(<OfflineBanner />);
    const banner = screen.getByText(/offline mode/i);
    expect(banner).toBeInTheDocument();
  });
});