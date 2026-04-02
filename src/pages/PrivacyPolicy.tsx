const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-8">Last updated: April 2, 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-lg font-semibold mb-2">1. Overview</h2>
          <p>VLOOKUP Web App ("the App") is a browser-based data lookup tool designed and maintained by Frank Bazuaye, powered by LiveGig Ltd. Your privacy is important to us.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">2. Data Collection & Processing</h2>
          <p>The App processes your uploaded CSV and Excel files <strong>entirely in your browser</strong>. No file data is transmitted to any server, stored, or shared with third parties. All computations happen client-side using JavaScript.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">3. AI-Powered Suggestions</h2>
          <p>The App may send column header names (not your data values) to an AI service to suggest matching columns. No personal or sensitive row-level data is ever transmitted.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">4. Cookies & Local Storage</h2>
          <p>The App may use local storage for PWA caching (offline support). No tracking cookies are used. No analytics or advertising trackers are deployed.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">5. Third-Party Services</h2>
          <p>The App does not integrate with any advertising networks, social media trackers, or third-party analytics services. The only external service used is the AI suggestion endpoint.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">6. Data Retention</h2>
          <p>No user data is retained by the App. Once you close or refresh the browser tab, all uploaded data is discarded from memory.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">7. Children's Privacy</h2>
          <p>The App does not knowingly collect or process data from children under 13 (COPPA) or under 16 (GDPR).</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">8. Your Rights</h2>
          <p>Since no personal data is collected or stored, there is no data to access, modify, or delete. You are in full control of your data at all times.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">9. Platform Permissions (Mobile)</h2>
          <p>When installed as a PWA on Android or iOS, the App may request permission to store files for offline use. No camera, microphone, contacts, or location permissions are requested.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">10. Changes to This Policy</h2>
          <p>We may update this policy occasionally. Changes will be reflected on this page with an updated date.</p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">11. Contact</h2>
          <p>For privacy concerns, contact LiveGig Ltd via the app's support channels.</p>
        </div>
      </section>

      <div className="mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
        Designed By Frank Bazuaye · Powered By LiveGig Ltd
      </div>
    </div>
  );
};

export default PrivacyPolicy;
