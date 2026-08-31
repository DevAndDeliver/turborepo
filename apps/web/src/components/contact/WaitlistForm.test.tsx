// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { WaitlistForm } from "./WaitlistForm";

describe("WaitlistForm", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    cleanup();
    global.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  function submit(email: string) {
    render(<WaitlistForm />);
    const input = screen.getByLabelText("Email") as HTMLInputElement;
    fireEvent.change(input, { target: { value: email } });
    fireEvent.submit(input.closest("form")!);
    return input;
  }

  it("does not submit an invalid email — shows a field error instead", async () => {
    const input = submit("not-an-email");

    await vi.waitFor(() => {
      expect(input.className).toContain("border-red-500");
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("submits a valid email and shows the success state", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    submit("jane@example.com");

    expect(await screen.findByText(/you're subscribed/i)).toBeDefined();
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/waitlist"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ email: "jane@example.com" }),
      }),
    );
  });

  it("shows an error message when the API responds with a non-2xx status", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false, status: 500 });
    submit("jane@example.com");

    expect(await screen.findByText(/something went wrong/i)).toBeDefined();
  });

  it("shows an error message when the request throws (network failure)", async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"));
    submit("jane@example.com");

    expect(await screen.findByText(/something went wrong/i)).toBeDefined();
  });
});
