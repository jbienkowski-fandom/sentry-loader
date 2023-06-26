import type * as Sentry from '@sentry/browser';

declare global {
    interface Window {
        Sentry: typeof Sentry;
    }
}

const DSN_REGEX = new RegExp(/https:\/\/(.*)@.*/);

function loadSentry(dsn: string): Promise<void> {
    return new Promise((resolve) => {
        const script: HTMLScriptElement = document.createElement("script");

        script.src = dsn.replace(DSN_REGEX, 'https://js.sentry-cdn.com/$1.min.js');
        script.crossOrigin = "anonymous"
        script.onload = () => resolve();

        const temp = document.getElementsByTagName("script")[0];

        temp.parentNode.append(script);
    });
}

function initSentry(projectId: number): void {
    window.Sentry.onLoad(() => {
        window.Sentry.init({
                        release: 'variant_2'
                    });
        window.Sentry.getCurrentHub().run(hub => hub.captureException(new Error('error project ' + projectId)));
    });
}

loadSentry(process.env.SENTRY_DSN_1).then(() => initSentry(1));
loadSentry(process.env.SENTRY_DSN_2).then(() => initSentry(2));
