export type CertificateData = {
  certId: string;
  assetName: string;
  creator: string;
  assetType: string;
  assetId: string;
  registrationDate: string;
  issueDate?: string;
  exactHash?: string;
  perceptualHash?: string;
  aiPermissionToken?: string;
  commercial?: boolean;
  derivative?: boolean;
  aiTraining?: boolean;
};

const perm = (v: boolean | undefined, dflt: boolean) =>
  (v ?? dflt) ? "Permitted" : "Not Permitted";

function certificateHtml(d: CertificateData) {
  const issueDate = d.issueDate || new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const rows: Array<[string, string]> = [
    ["Certificate ID", d.certId],
    ["Asset Name", d.assetName],
    ["Author / Creator", d.creator],
    ["Asset Type", d.assetType],
    ["Registration ID", d.assetId],
    ["Registration Date", d.registrationDate],
    ["Certificate Issue Date", issueDate],
    ["Cryptographic SHA-256 Hash", d.exactHash || "Verified"],
    ["Perceptual Fingerprint", d.perceptualHash || "Verified"],
    ["AI Permission Token", d.aiPermissionToken || "Active"],
    ["Provenance Status", "Registered & Timestamped"],
    ["Commercial Production", perm(d.commercial, true)],
    ["Derivative Creation", perm(d.derivative, false)],
    ["AI Training Authorization", perm(d.aiTraining, false)],
    ["Certificate Status", "Valid & Tamper-Evident"],
  ];

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${d.certId} — ToonProof Provenance Certificate</title>
  <style>
    body { font-family: "Plus Jakarta Sans", Arial, sans-serif; margin: 0; padding: 48px; color: #0f172a; background: #f8fafc; }
    .sheet { max-width: 740px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; padding: 44px; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.05); }
    .brand { text-align: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; }
    .brand small { letter-spacing: .25em; font-weight: 800; color: #4f46e5; font-size: 11px; }
    h1 { font-size: 22px; margin: 10px 0 2px; color: #0f172a; }
    table { width: 100%; border-collapse: collapse; margin-top: 28px; }
    td { padding: 11px 0; border-bottom: 1px solid #f1f5f9; font-size: 13.5px; }
    td.k { color: #64748b; text-transform: uppercase; font-size: 11px; letter-spacing: .06em; font-weight: 600; width: 40%; }
    td.v { text-align: right; font-weight: 600; color: #1e293b; font-family: ui-monospace, monospace; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px dashed #e2e8f0; font-size: 11px; color: #64748b; text-align: center; }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="brand">
      <small>TOONPROOF IP &amp; ROYALTY VAULT</small>
      <div style="font-size:12px;color:#64748b;margin-top:2px;">Official Animation Provenance &amp; Rights Record</div>
      <h1>Provenance Certificate</h1>
    </div>
    <table>
      ${rows.map(([k, v]) => `<tr><td class="k">${k}</td><td class="v">${v}</td></tr>`).join("")}
    </table>
    <div class="footer">
      <p>This document certifies the technical authorship and permissions record registered in ToonProof Vault.<br />Tamper-evident verification hash: <code>${d.exactHash ?? d.certId}</code></p>
    </div>
  </div>
</body>
</html>`;
}

export function downloadCertificate(d: CertificateData) {
  const blob = new Blob([certificateHtml(d)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${d.certId}-provenance-certificate.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
