
'use client';

import Link from 'next/link';

export default function TermsAndConditionsPage() {
  return (
    <div className="bg-background text-foreground">
      <main className="container mx-auto px-4 py-12 md:px-6">
        <article className="prose-styles mx-auto max-w-3xl">
          <h1 className="text-3xl font-bold mb-6 border-b pb-4">Terms and Conditions</h1>

          <p className="mb-4"><strong>Company Name:</strong> EZ Perfil Webinars, powered by EZ Perfil LLC</p>

          <p className="mb-4">Last updated: February 04, 2025</p>

          <p className="mb-4">By using the services provided by <strong>EZ Perfil Webinars</strong>, you agree to comply with and be bound by the following terms and conditions. Please read them carefully. If you do not agree with any part of these terms, you must refrain from using our services.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">1. Interpretation and Definitions</h2>
          <ul className="list-disc list-inside space-y-1 mb-4 pl-4">
            <li><strong>Affiliate:</strong> A party that controls, is controlled by, or is under common control with another party. </li>
            <li><strong>Country:</strong> California, United States</li>
            <li><strong>Company:</strong> Refers to EZ Perfil Webinars, Oxnard, California 93036.</li>
            <li><strong>Service:</strong> Refers to the Website.</li>
            <li><strong>Website:</strong> Refers to <strong>EZ Perfil Webinars</strong>, accessible through our official domain.</li>
            <li><strong>You:</strong> The user accessing or using the Service. </li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">2. Acknowledgment</h2>
          <p className="mb-4">Your use of the Service constitutes your acceptance of these Terms and Conditions. By accessing the Service, you agree to abide by these terms and all applicable laws and regulations. If you do not agree with any part of these terms, please do not use the Service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">3. Activation Review and Participation Rights</h2>
          <p className="mb-4">EZ Perfil Webinars reserves the right to review all Starter Package activations within a period of fourteen (14) calendar days from the date of registration. During this period, the Company may evaluate the background and business conduct of the registrant to ensure alignment with the integrity and values of our community.</p>
          <p className="mb-4">If it is determined, at the sole discretion of EZ Perfil Webinars or its representatives, that a participant’s prior conduct in other business ventures, such as unethical practices, misrepresentation, or activities harmful to network development, may pose a risk to the reputation or growth of the organization, the Company reserves the right to cancel the activation.</p>
          <p className="mb-4">In such cases, any payment made for the Starter Package may be refunded in accordance with applicable refund policies. The Company shall not be liable for damages or losses resulting from such a cancellation, and the participant waives any legal claim or dispute related to this decision.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">4. Links to Other Websites</h2>
          <p className="mb-4">Our Service may contain links to third-party websites that are not controlled by the Company. We are not responsible for the content or practices of these external sites. We recommend reviewing their terms and privacy policies.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">5. Limitation of Liability</h2>
          <p className="mb-4">In no event shall the Company be liable for any indirect, incidental, special, or consequential damage arising from your use of the Service. The maximum liability is limited to the greater of $100 USD or the amount you paid to the Company for the use of the Service.</p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">6. Data Collection and Privacy</h2>
          <p className="mb-4">
            Your use of the Service is subject to our{' '}
            <Link href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
            , which explains how we collect, use, and protect your personal data. Please read the Privacy Policy to understand your rights regarding your personal information.
          </p>

        </article>
      </main>
    </div>
  );
}
