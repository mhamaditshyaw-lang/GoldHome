// Mobile keyboard fix utility
export class MobileKeyboardFix {
  private static instance: MobileKeyboardFix;
  private originalHeight: number;
  private isKeyboardOpen: boolean = false;
  private listeners: (() => void)[] = [];

  constructor() {
    this.originalHeight = window.innerHeight;
    this.initializeListeners();
  }

  static getInstance(): MobileKeyboardFix {
    if (!MobileKeyboardFix.instance) {
      MobileKeyboardFix.instance = new MobileKeyboardFix();
    }
    return MobileKeyboardFix.instance;
  }

  private initializeListeners() {
    // Handle viewport changes
    const handleResize = () => {
      const currentHeight = window.innerHeight;
      const heightDiff = this.originalHeight - currentHeight;
      
      // Keyboard is considered open if height difference is significant
      const wasKeyboardOpen = this.isKeyboardOpen;
      this.isKeyboardOpen = heightDiff > 150;

      if (wasKeyboardOpen !== this.isKeyboardOpen) {
        this.adjustViewport();
        this.notifyListeners();
      }
    };

    // Handle input focus/blur
    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (this.isInputElement(target)) {
        this.handleInputFocus(target);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        this.handleInputBlur();
      }, 300);
    };

    // Visual Viewport API (modern browsers)
    if ('visualViewport' in window && window.visualViewport) {
      (window.visualViewport as any).addEventListener('resize', handleResize);
    } else {
      window.addEventListener('resize', handleResize);
    }

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // Store cleanup function
    this.cleanup = () => {
      if ('visualViewport' in window && window.visualViewport) {
        (window.visualViewport as any).removeEventListener('resize', handleResize);
      } else {
        window.removeEventListener('resize', handleResize);
      }
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }

  private cleanup: () => void = () => {};

  private isInputElement(element: HTMLElement): boolean {
    const tagName = element.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];
    return inputTypes.includes(tagName);
  }

  private handleInputFocus(element: HTMLElement) {
    // Prevent zoom on iOS
    if (this.isIOS()) {
      const fontSize = window.getComputedStyle(element).fontSize;
      if (parseFloat(fontSize) < 16) {
        element.style.fontSize = '16px';
      }
    }

    // Scroll element into view after a short delay
    setTimeout(() => {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }, 300);
  }

  private handleInputBlur() {
    // Reset viewport
    window.scrollTo(0, 0);
    this.adjustViewport();
  }

  private adjustViewport() {
    const html = document.documentElement;
    const body = document.body;

    if (this.isKeyboardOpen) {
      // Fix viewport when keyboard is open
      body.style.position = 'fixed';
      body.style.top = '0';
      body.style.left = '0';
      body.style.width = '100%';
      body.style.height = `${window.innerHeight}px`;
      body.style.overflow = 'hidden';
      
      // Prevent background scroll
      html.style.overflow = 'hidden';
    } else {
      // Restore viewport when keyboard is closed
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.width = '';
      body.style.height = '';
      body.style.overflow = '';
      
      html.style.overflow = '';
      
      // Reset scroll position
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 100);
    }
  }

  private isIOS(): boolean {
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  }

  private isAndroid(): boolean {
    return /Android/.test(navigator.userAgent);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }

  public onKeyboardToggle(callback: () => void) {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getKeyboardState() {
    return {
      isOpen: this.isKeyboardOpen,
      height: this.isKeyboardOpen ? this.originalHeight - window.innerHeight : 0
    };
  }

  public destroy() {
    this.cleanup();
    this.listeners = [];
  }
}

// Initialize the mobile keyboard fix
export const mobileKeyboardFix = MobileKeyboardFix.getInstance();