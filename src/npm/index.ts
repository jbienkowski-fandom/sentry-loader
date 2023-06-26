import {
    Breadcrumbs,
    BrowserClient,
    Dedupe,
    defaultStackParser,
    HttpContext, Hub,
    LinkedErrors,
    makeFetchTransport
} from '@sentry/browser';

function createSentryInstance(dsn: string): Hub {
    const options = {
        dsn,
        release: "variant_1",
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
    return new Hub(client);
}

const hub1 = createSentryInstance(process.env.SENTRY_DSN_1);
const hub2 = createSentryInstance(process.env.SENTRY_DSN_2);

hub1.captureException(new Error('error project 1'));
hub2.captureException(new Error('error project 2'));
