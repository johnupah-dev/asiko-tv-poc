/* =========================================================
   ASIKO TV — Lead capture / CRM bridge
   ---------------------------------------------------------
   This file is the ONE place to wire up a real backend.

   Right now, with CRM_ENDPOINT left blank, every form on the
   site still works end-to-end: submissions are validated,
   stored for this browser session (so the /admin.html demo
   board has something to show), and handed to the visitor's
   own mail client as a pre-filled email to Media Icons Africa
   — so leads are never silently lost even before a backend
   is connected.

   TO GO LIVE WITH A REAL CRM / marky.ai / a webhook:
   1. Set CRM_ENDPOINT below to your POST URL (a marky.ai
      inbound webhook, a Zapier/Make catcher, HubSpot form
      endpoint, or your own /api/leads route).
   2. That's it — submitLead() will POST JSON to it
      automatically and skip the mailto fallback whenever the
      request succeeds.
   ========================================================= */

var CRM_ENDPOINT = ""; // <-- paste your marky.ai / CRM webhook URL here
var CRM_NOTIFY_EMAIL = "john.upah@mediaiconsltd.com";

var ASIKO_LEADS_KEY = "__asikoSessionLeads";
window[ASIKO_LEADS_KEY] = window[ASIKO_LEADS_KEY] || [];

function asikoBuildMailto(lead){
  var subject = encodeURIComponent("[Asiko TV website] " + lead.formType + " — " + (lead.fields.name || lead.fields.channelName || lead.fields.company || "New submission"));
  var lines = ["New submission from asiko.live", "Form: " + lead.formType, ""];
  Object.keys(lead.fields).forEach(function(k){
    if(lead.fields[k]) lines.push(k + ": " + lead.fields[k]);
  });
  var body = encodeURIComponent(lines.join("\n"));
  return "mailto:" + CRM_NOTIFY_EMAIL + "?subject=" + subject + "&body=" + body;
}

/**
 * submitLead
 * @param {string} formType - e.g. "Channel Sign-Up", "Advertiser Enquiry"
 * @param {object} fields - flat key/value pairs from the form
 * @param {function} onDone - callback(result) where result = {ok, mode}
 */
function submitLead(formType, fields, onDone){
  var lead = {
    id: "lead_" + Date.now().toString(36),
    formType: formType,
    fields: fields,
    submittedAt: new Date().toISOString(),
    source: "asiko.live"
  };
  window[ASIKO_LEADS_KEY].push(lead);

  if(CRM_ENDPOINT){
    fetch(CRM_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    }).then(function(res){
      onDone && onDone({ ok: res.ok, mode: "backend", lead: lead });
    }).catch(function(){
      onDone && onDone({ ok: true, mode: "mailto", lead: lead, mailto: asikoBuildMailto(lead) });
    });
  } else {
    // No backend configured yet — hand off to email so nothing is lost.
    onDone && onDone({ ok: true, mode: "mailto", lead: lead, mailto: asikoBuildMailto(lead) });
  }
}

/** Wires a <form> element to submitLead with basic HTML5 validation. */
function asikoBindForm(formEl, formType, opts){
  opts = opts || {};
  formEl.addEventListener("submit", function(e){
    e.preventDefault();
    if(!formEl.reportValidity()) return;

    var fields = {};
    new FormData(formEl).forEach(function(value, key){
      if(fields[key] !== undefined){
        fields[key] = Array.isArray(fields[key]) ? fields[key].concat(value) : [fields[key], value];
      } else {
        fields[key] = value;
      }
    });

    var submitBtn = formEl.querySelector('[type="submit"]');
    var originalLabel = submitBtn ? submitBtn.textContent : null;
    if(submitBtn){ submitBtn.disabled = true; submitBtn.textContent = "Sending…"; }

    submitLead(formType, fields, function(result){
      if(submitBtn){ submitBtn.disabled = false; submitBtn.textContent = originalLabel; }

      if(result.mode === "mailto"){
        var link = document.createElement("a");
        link.href = result.mailto;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }

      formEl.reset();
      formEl.querySelectorAll('.radio-pill.checked').forEach(function(p){ p.classList.remove('checked'); });

      if(opts.successEl){
        formEl.style.display = "none";
        opts.successEl.classList.add("show");
      } else {
        asikoToast("Thanks — your submission has been received. Our team will be in touch shortly.");
      }
    });
  });
}
