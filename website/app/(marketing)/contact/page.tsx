import type { Metadata } from 'next';
import Card from '@/components/ui/Card';
import ContactForm from '@/components/sections/ContactForm';

export const metadata: Metadata = {
  title: 'Contact | SAP Connect',
  description:
    'Get in touch about SAP Connect enterprise services, architecture reviews, migration planning, or custom development.',
};

export default function ContactPage() {
  return (
    <section aria-labelledby="contact-heading" className="py-20">
      <div className="container-site">
        <div className="mx-auto max-w-[700px]">
          <h1
            id="contact-heading"
            className="mb-4 text-[var(--font-size-h1)] font-bold leading-[var(--leading-heading)] text-[var(--color-text-primary)]"
          >
            Contact
          </h1>
          <p className="mb-10 text-[var(--font-size-body-l)] leading-relaxed text-[var(--color-text-secondary)]">
            Interested in enterprise services, architecture reviews, or migration
            planning? Fill out the form below and your message will be delivered
            directly to our team.
          </p>
          <Card className="mb-10">
            <ContactForm />
          </Card>
          <section aria-labelledby="alt-contact-heading">
            <h2
              id="alt-contact-heading"
              className="mb-3 text-[var(--font-size-h4)] font-semibold text-[var(--color-text-primary)]"
            >
              Alternative contact
            </h2>
            <p className="text-[var(--font-size-body-m)] leading-relaxed text-[var(--color-text-secondary)]">
              For technical questions, bug reports, or feature requests, open an
              issue on{' '}
              <a
                href="https://github.com/ib823/sapconnect/issues"
                className="font-medium text-[var(--color-brand)] underline underline-offset-4 hover:text-[var(--color-brand-hover)]"
                rel="noopener noreferrer"
                target="_blank"
              >
                GitHub Issues
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </section>
  );
}
