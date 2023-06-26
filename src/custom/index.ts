import type * as Sentry from '@sentry/browser';

declare global {
    interface Window {
        Sentry: typeof Sentry;
    }
}

class SentryLoader {
    private readonly errorQueue: Error[] = [];
    private hub: Sentry.Hub | undefined;

    constructor(private readonly dsn: string) {
    }

    get loaded(): boolean {
        return window.Sentry !== undefined;
    }

    captureException(error: Error): void {
        if (this.loaded) {
            this.hub?.captureException(error);
        } else {
            this.errorQueue.push(error);
            this.loadSentry();
        }
    }

    private loadSentry(): Promise<void> {
        return new Promise((resolve) => {
            const script: HTMLScriptElement = document.createElement("script");
            script.src = "https://browser.sentry-cdn.com/7.55.2/bundle.min.js";
            script.crossOrigin = "anonymous";
            script.integrity ="sha384-grzsqzUax9BbmJWNgYTLmejARf1orUEVEvvg2sXJ60jMyjmzW/Eh8hrCFkSu6GNm";
            script.onload = () => {
                this.createSentryInstance();
                this.flushErrorQueue();
                resolve();
            };

            const temp = document.getElementsByTagName("script")[0];

            temp.parentNode.append(script);
        });
    }

    private createSentryInstance(): void {
        const {
            Breadcrumbs,
            BrowserClient,
            Dedupe,
            defaultStackParser,
            HttpContext,
            Hub,
            LinkedErrors,
            makeFetchTransport
        } = window.Sentry;
        const options = {
            dsn: this.dsn,
            release: "variant_3",
            transport: makeFetchTransport,
            stackParser: defaultStackParser,
            integrations: [
                new Breadcrumbs(),
                new Dedupe(),
                new HttpContext(),
                new LinkedErrors(),
            ],
        };
        const client = new BrowserClient(options);
        this.hub = new Hub(client);
    }

    private flushErrorQueue() {
        this.errorQueue.forEach(error => this.hub?.captureException(error));
    }
}

const sentry1 = new SentryLoader(process.env.SENTRY_DSN_1);
const sentry2 = new SentryLoader(process.env.SENTRY_DSN_2);

sentry1.captureException(new Error('error project 1'));
sentry2.captureException(new Error('error project 2'));