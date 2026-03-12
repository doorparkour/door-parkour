import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "../contact/route";

// vi.hoisted ensures mockSend is initialized before vi.mock() hoisting runs
const mockSend = vi.hoisted(() => vi.fn());

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

function makeRequest(body: object) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

const validBody = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@example.com",
  subject: "Question",
  message: "Hello there",
};

beforeEach(() => {
  mockSend.mockReset();
});

describe("POST /api/contact", () => {
  it("returns success when email sends", async () => {
    mockSend.mockResolvedValue({ data: {}, error: null });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
  });

  it("passes correct fields to Resend", async () => {
    mockSend.mockResolvedValue({ data: {}, error: null });

    await POST(makeRequest(validBody));

    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "noreply@doorparkour.com",
        to: "steven@doorparkour.com",
        subject: "[Contact] Question",
      })
    );
  });

  it("returns 500 when Resend returns an error", async () => {
    mockSend.mockResolvedValue({ data: null, error: { message: "API error" } });

    const res = await POST(makeRequest(validBody));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ error: "API error" });
  });
});
