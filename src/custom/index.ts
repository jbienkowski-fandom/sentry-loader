import type * as Sentry from '@sentry/browser';

declare global {
    interface Window {
        Sentry: typeof Sentry;
    }
}

function waitFor(condition: () => boolean, numOfTries = 10, interval = 50): Promise<void> {
    return new Promise((resolve, reject) => {
        let tries = 0;
        const intervalId = setInterval(() => {
            if (condition()) {
                clearInterval(intervalId);
                resolve();
            }
            if (tries++ > numOfTries) {
                clearInterval(intervalId);
                reject();
            }
        }, interval);
    });
}

class SentryLoader {
    private static SENTRY_SCRIPT_CDN_URL = "https://browser.sentry-cdn.com/7.55.2/bundle.min.js";
    private static SENTRY_SCRIPT_INTEGRITY = "sha384-grzsqzUax9BbmJWNgYTLmejARf1orUEVEvvg2sXJ60jMyjmzW/Eh8hrCFkSu6GNm";

    private readonly errorQueue: Error[] = [];
    private hub: Sentry.Hub | undefined;

    constructor(private readonly dsn: string) {
    }

    get inserted(): boolean {
        return Array.from(document.getElementsByTagName("script"))
            .some((script: HTMLScriptElement) => script.src === SentryLoader.SENTRY_SCRIPT_CDN_URL);
    }

    get loaded(): boolean {
        return window.Sentry !== undefined;
    }

    get initialized(): boolean {
        return this.hub !== undefined;
    }

    captureException(error: Error): void {
        if (!this.inserted) {
            this.errorQueue.push(error);
            this.loadSentry();
            return;
        }

        if (!this.loaded) {
            this.errorQueue.push(error);
            waitFor(() => this.loaded)
                .then(() => this.createSentryInstance())
                .then(() => this.flushErrorQueue());
            return;
        }

        if (!this.initialized) {
            this.createSentryInstance();
        }

        this.hub.captureException(error);
    }

    private loadSentry(): Promise<void> {
        return new Promise((resolve) => {
            const script: HTMLScriptElement = document.createElement("script");
            script.src = SentryLoader.SENTRY_SCRIPT_CDN_URL;
            script.crossOrigin = "anonymous";
            script.integrity = SentryLoader.SENTRY_SCRIPT_INTEGRITY;
            script.onload = () => {
                this.createSentryInstance();
                this.flushErrorQueue();
                resolve();
            };

            const temp = document.getElementsByTagName("script")[0];

            temp.parentNode.append(script);
        });
    }

    private createSentryInstance(): Sentry.Hub {
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
        return this.hub;
    }

    private flushErrorQueue() {
        this.errorQueue.forEach(error => this.hub?.captureException(error));
    }
}

const sentry1 = new SentryLoader(process.env.SENTRY_DSN_1);
sentry1.captureException(new Error('error project 1 #1'));
sentry1.captureException(new SyntaxError('error project 1 #2'));

setTimeout(() => {
    const sentry2 = new SentryLoader(process.env.SENTRY_DSN_2);
    sentry2.captureException(new Error('error project 2 #1'));
    sentry2.captureException(new SyntaxError('error project 2 #2'));
});