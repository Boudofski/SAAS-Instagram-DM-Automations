import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ effect: null as null | (() => (() => void)), video: null as any }));
vi.mock("react", async (original) => ({ ...await original<typeof import("react")>(), useRef: () => ({ current: state.video }), useEffect: (effect: any) => { state.effect = effect; } }));
vi.mock("@/providers/i18n-provider", () => ({ useI18n: () => ({ locale: "en" }) }));
import VisibleProductVideo from "@/components/website/visible-product-video";

describe("visible product demos", () => {
  let observe: (entries: { isIntersecting: boolean }[]) => void;
  let visibility: () => void;
  let motion: { matches: boolean; addEventListener: ReturnType<typeof vi.fn>; removeEventListener: ReturnType<typeof vi.fn> };
  let cleanup: (() => void) | undefined;
  beforeEach(() => {
    state.video = { src: "", controls: false, load: vi.fn(), play: vi.fn().mockResolvedValue(undefined), pause: vi.fn(), getAttribute: () => state.video.src || null, removeAttribute: () => { state.video.src = ""; } };
    motion = { matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() };
    vi.stubGlobal("window", { matchMedia: () => motion });
    vi.stubGlobal("document", { visibilityState: "visible", addEventListener: (_: string, cb: () => void) => { visibility = cb; }, removeEventListener: vi.fn() });
    vi.stubGlobal("IntersectionObserver", class { constructor(cb: typeof observe) { observe = cb; } observe() {} disconnect() {} });
    VisibleProductVideo({ src: "/media/demo.mp4", label: "Demo" });
    cleanup = state.effect!();
  });
  afterEach(() => { cleanup?.(); vi.unstubAllGlobals(); });
  it("does not load until visible and pauses when leaving the viewport", async () => {
    expect(state.video.src).toBe("");
    expect(state.video.play).not.toHaveBeenCalled();
    observe([{ isIntersecting: true }]);
    await Promise.resolve();
    expect(state.video.src).toBe("/media/demo.mp4");
    expect(state.video.play).toHaveBeenCalledOnce();
    observe([{ isIntersecting: false }]);
    expect(state.video.pause).toHaveBeenCalled();
  });
  it("pauses for hidden tabs and exposes controls for reduced motion", () => {
    observe([{ isIntersecting: true }]);
    Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
    visibility();
    expect(state.video.pause).toHaveBeenCalled();
    motion.matches = true;
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
    visibility();
    expect(state.video.controls).toBe(true);
    expect(state.video.play).toHaveBeenCalledOnce();
  });
  it("provides manual playback when autoplay is rejected", async () => {
    state.video.play.mockRejectedValueOnce(new Error("autoplay blocked"));
    observe([{ isIntersecting: true }]);
    await Promise.resolve();
    await Promise.resolve();
    expect(state.video.controls).toBe(true);
  });
});
