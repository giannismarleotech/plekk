/** Teksten van de publieke boekingspagina, in de taal van de zaak (org.locale). */
export type PublicLocale = "nl" | "fr" | "en" | "de";

export type PublicStrings = {
  ctaSalon: string; ctaRestaurant: string; ctaTakeaway: string;
  chooseService: string; whoWith: string; anyone: string; howMany: string; largeGroup: string; depositNote: (from: number, pp: string, total: string) => string;
  composeOrder: string; whenPickup: string; chooseMoment: string; chooseServiceFirst: string; addItemFirst: string; loadingSlots: string; noSlots: string;
  yourDetails: string; name: string; phone: string; email: string; emailHint: string; note: string; optional: string; notePlaceholder: [string, string, string];
  at: string; total: string; payAtPickup: string; wait: string; placeOrder: string; reserve: string; reserveAndPay: string; confirmAppointment: string;
  yourOrder: string; nothingYet: string; add: string; cancel: string; multiple: string; less: string; more: string;
  openingHours: string; weekdays: string[];
  confirmedTitle: { order: string; requested: string; reservation: string; appointment: string }; person: string; people: string; with: string; depositTitle: string; depositBody: string; payDeposit: string; payNow: string; payAtPickupShort: string; reference: string; mailedTo: string; changeOrCancel: string; call: string; back: string;
  cancelTitle: string; cancelBody: (hours: number) => string; cancelButton: string; cancelled: string; cancelTooLate: string; manageBooking: string;
  poweredBy: string; noCommission: string;
  demoBadge: string; demoBanner: string; backToSite: string;
};

const nl: PublicStrings = {
  ctaSalon: "Boek een afspraak", ctaRestaurant: "Reserveer een tafel", ctaTakeaway: "Bestel om af te halen",
  chooseService: "Kies een behandeling", whoWith: "Bij wie?", anyone: "Eender wie", howMany: "Met hoeveel personen?", largeGroup: "Voor grote groepen kan je hier tot 20 personen kiezen:",
  depositNote: (from, pp, total) => `Vanaf ${from} personen vragen we een waarborg van ${pp} per persoon (${total}), verrekend op de rekening.`,
  composeOrder: "Stel je bestelling samen", whenPickup: "Wanneer kom je afhalen?", chooseMoment: "Kies een moment", chooseServiceFirst: "Kies eerst een behandeling.", addItemFirst: "Voeg eerst iets toe aan je bestelling.", loadingSlots: "Beschikbaarheid ophalen…", noSlots: "Geen vrije momenten op deze dag. Probeer een andere dag.",
  yourDetails: "Jouw gegevens", name: "Naam", phone: "Gsm", email: "E-mail", emailHint: "(voor je bevestiging)", note: "Opmerking", optional: "(optioneel)", notePlaceholder: ["Iets wat we moeten weten?", "Allergieën, kinderstoel, verjaardag…", "Extra zout, zonder ui…"],
  at: "om", total: "totaal", payAtPickup: "(betalen bij afhaling)", wait: "Even geduld…", placeOrder: "Bestelling plaatsen", reserve: "Reserveren", reserveAndPay: "Reserveren en waarborg betalen", confirmAppointment: "Afspraak bevestigen",
  yourOrder: "Je bestelling", nothingYet: "Nog niets gekozen.", add: "Toevoegen", cancel: "Annuleren", multiple: "(meerdere mogelijk)", less: "minder", more: "meer",
  openingHours: "Openingsuren", weekdays: ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"],
  confirmedTitle: { order: "Bestelling ontvangen", requested: "Reservatie aangevraagd", reservation: "Tafel gereserveerd", appointment: "Afspraak bevestigd" }, person: "persoon", people: "personen", with: "bij", depositTitle: "Waarborg", depositBody: "Je reservatie is definitief zodra de waarborg betaald is.", payDeposit: "Waarborg betalen", payNow: "Nu betalen", payAtPickupShort: "Betalen bij afhaling.", reference: "Referentie", mailedTo: "bevestiging gemaild naar", changeOrCancel: "Wijzigen of annuleren?", call: "Bel", back: "Terug naar",
  cancelTitle: "Annuleren", cancelBody: (h) => `Je kan zelf annuleren tot ${h} uur vooraf.`, cancelButton: "Ja, annuleer mijn boeking", cancelled: "Geannuleerd. Tot een volgende keer!", cancelTooLate: "Zelf annuleren kan niet meer. Bel de zaak even.", manageBooking: "Boeking beheren",
  poweredBy: "Boeken via", noCommission: "geen commissie, ooit",
  demoBadge: "Demozaak", demoBanner: "Dit is een demozaak van Plekk. Boekingen zijn niet echt — probeer gerust alles uit.", backToSite: "Terug naar plekk.be",
};

const fr: PublicStrings = {
  ctaSalon: "Prendre rendez-vous", ctaRestaurant: "Réserver une table", ctaTakeaway: "Commander à emporter",
  chooseService: "Choisissez un soin", whoWith: "Avec qui ?", anyone: "N’importe qui", howMany: "Combien de personnes ?", largeGroup: "Pour les grands groupes, choisissez jusqu’à 20 personnes :",
  depositNote: (from, pp, total) => `À partir de ${from} personnes, nous demandons une caution de ${pp} par personne (${total}), déduite de l’addition.`,
  composeOrder: "Composez votre commande", whenPickup: "Quand venez-vous chercher ?", chooseMoment: "Choisissez un moment", chooseServiceFirst: "Choisissez d’abord un soin.", addItemFirst: "Ajoutez d’abord un article.", loadingSlots: "Chargement des disponibilités…", noSlots: "Aucun créneau libre ce jour-là. Essayez un autre jour.",
  yourDetails: "Vos coordonnées", name: "Nom", phone: "GSM", email: "E-mail", emailHint: "(pour votre confirmation)", note: "Remarque", optional: "(facultatif)", notePlaceholder: ["Quelque chose à savoir ?", "Allergies, chaise haute, anniversaire…", "Plus de sel, sans oignons…"],
  at: "à", total: "total", payAtPickup: "(paiement à l’enlèvement)", wait: "Un instant…", placeOrder: "Passer la commande", reserve: "Réserver", reserveAndPay: "Réserver et payer la caution", confirmAppointment: "Confirmer le rendez-vous",
  yourOrder: "Votre commande", nothingYet: "Rien de choisi pour l’instant.", add: "Ajouter", cancel: "Annuler", multiple: "(plusieurs possibles)", less: "moins", more: "plus",
  openingHours: "Heures d’ouverture", weekdays: ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"],
  confirmedTitle: { order: "Commande reçue", requested: "Réservation demandée", reservation: "Table réservée", appointment: "Rendez-vous confirmé" }, person: "personne", people: "personnes", with: "chez", depositTitle: "Caution", depositBody: "Votre réservation est définitive dès que la caution est payée.", payDeposit: "Payer la caution", payNow: "Payer maintenant", payAtPickupShort: "Paiement à l’enlèvement.", reference: "Référence", mailedTo: "confirmation envoyée à", changeOrCancel: "Modifier ou annuler ?", call: "Appelez le", back: "Retour vers",
  cancelTitle: "Annuler", cancelBody: (h) => `Vous pouvez annuler vous-même jusqu’à ${h} h à l’avance.`, cancelButton: "Oui, annuler ma réservation", cancelled: "Annulé. À une prochaine fois !", cancelTooLate: "Il est trop tard pour annuler en ligne. Appelez le commerce.", manageBooking: "Gérer ma réservation",
  poweredBy: "Réservation via", noCommission: "sans commission, jamais",
  demoBadge: "Commerce de démo", demoBanner: "Ceci est un commerce de démonstration Plekk. Les réservations ne sont pas réelles.", backToSite: "Retour sur plekk.be",
};

const en: PublicStrings = {
  ctaSalon: "Book an appointment", ctaRestaurant: "Reserve a table", ctaTakeaway: "Order for pickup",
  chooseService: "Choose a treatment", whoWith: "With whom?", anyone: "Anyone", howMany: "How many people?", largeGroup: "For large groups, choose up to 20 people here:",
  depositNote: (from, pp, total) => `From ${from} people we ask a deposit of ${pp} per person (${total}), deducted from the bill.`,
  composeOrder: "Build your order", whenPickup: "When will you pick up?", chooseMoment: "Choose a time", chooseServiceFirst: "Choose a treatment first.", addItemFirst: "Add something to your order first.", loadingSlots: "Checking availability…", noSlots: "No free slots on this day. Try another day.",
  yourDetails: "Your details", name: "Name", phone: "Mobile", email: "Email", emailHint: "(for your confirmation)", note: "Note", optional: "(optional)", notePlaceholder: ["Anything we should know?", "Allergies, high chair, birthday…", "Extra salt, no onions…"],
  at: "at", total: "total", payAtPickup: "(pay at pickup)", wait: "One moment…", placeOrder: "Place order", reserve: "Reserve", reserveAndPay: "Reserve and pay deposit", confirmAppointment: "Confirm appointment",
  yourOrder: "Your order", nothingYet: "Nothing chosen yet.", add: "Add", cancel: "Cancel", multiple: "(multiple possible)", less: "less", more: "more",
  openingHours: "Opening hours", weekdays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  confirmedTitle: { order: "Order received", requested: "Reservation requested", reservation: "Table reserved", appointment: "Appointment confirmed" }, person: "person", people: "people", with: "with", depositTitle: "Deposit", depositBody: "Your reservation is final once the deposit is paid.", payDeposit: "Pay deposit", payNow: "Pay now", payAtPickupShort: "Pay at pickup.", reference: "Reference", mailedTo: "confirmation sent to", changeOrCancel: "Change or cancel?", call: "Call", back: "Back to",
  cancelTitle: "Cancel", cancelBody: (h) => `You can cancel yourself up to ${h} hours in advance.`, cancelButton: "Yes, cancel my booking", cancelled: "Cancelled. See you next time!", cancelTooLate: "Online cancellation is no longer possible. Please call the business.", manageBooking: "Manage booking",
  poweredBy: "Booking via", noCommission: "no commission, ever",
  demoBadge: "Demo business", demoBanner: "This is a Plekk demo business. Bookings aren’t real — feel free to try everything.", backToSite: "Back to plekk.be",
};

const de: PublicStrings = {
  ctaSalon: "Termin buchen", ctaRestaurant: "Tisch reservieren", ctaTakeaway: "Zum Abholen bestellen",
  chooseService: "Behandlung wählen", whoWith: "Bei wem?", anyone: "Egal wer", howMany: "Wie viele Personen?", largeGroup: "Für große Gruppen bis zu 20 Personen wählen:",
  depositNote: (from, pp, total) => `Ab ${from} Personen bitten wir um eine Anzahlung von ${pp} pro Person (${total}), die mit der Rechnung verrechnet wird.`,
  composeOrder: "Bestellung zusammenstellen", whenPickup: "Wann holen Sie ab?", chooseMoment: "Zeit wählen", chooseServiceFirst: "Wählen Sie zuerst eine Behandlung.", addItemFirst: "Fügen Sie zuerst etwas zur Bestellung hinzu.", loadingSlots: "Verfügbarkeit wird geladen…", noSlots: "Keine freien Zeiten an diesem Tag. Versuchen Sie einen anderen Tag.",
  yourDetails: "Ihre Angaben", name: "Name", phone: "Handy", email: "E-Mail", emailHint: "(für Ihre Bestätigung)", note: "Anmerkung", optional: "(optional)", notePlaceholder: ["Sollten wir etwas wissen?", "Allergien, Kinderstuhl, Geburtstag…", "Extra Salz, ohne Zwiebeln…"],
  at: "um", total: "gesamt", payAtPickup: "(Zahlung bei Abholung)", wait: "Einen Moment…", placeOrder: "Bestellung aufgeben", reserve: "Reservieren", reserveAndPay: "Reservieren und Anzahlung leisten", confirmAppointment: "Termin bestätigen",
  yourOrder: "Ihre Bestellung", nothingYet: "Noch nichts gewählt.", add: "Hinzufügen", cancel: "Abbrechen", multiple: "(mehrere möglich)", less: "weniger", more: "mehr",
  openingHours: "Öffnungszeiten", weekdays: ["Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag"],
  confirmedTitle: { order: "Bestellung eingegangen", requested: "Reservierung angefragt", reservation: "Tisch reserviert", appointment: "Termin bestätigt" }, person: "Person", people: "Personen", with: "bei", depositTitle: "Anzahlung", depositBody: "Ihre Reservierung ist verbindlich, sobald die Anzahlung bezahlt ist.", payDeposit: "Anzahlung bezahlen", payNow: "Jetzt bezahlen", payAtPickupShort: "Zahlung bei Abholung.", reference: "Referenz", mailedTo: "Bestätigung gesendet an", changeOrCancel: "Ändern oder stornieren?", call: "Rufen Sie an:", back: "Zurück zu",
  cancelTitle: "Stornieren", cancelBody: (h) => `Sie können bis ${h} Stunden vorher selbst stornieren.`, cancelButton: "Ja, meine Buchung stornieren", cancelled: "Storniert. Bis zum nächsten Mal!", cancelTooLate: "Online-Stornierung ist nicht mehr möglich. Bitte rufen Sie den Betrieb an.", manageBooking: "Buchung verwalten",
  poweredBy: "Buchung über", noCommission: "keine Provision, nie",
  demoBadge: "Demo-Betrieb", demoBanner: "Dies ist ein Plekk-Demo-Betrieb. Buchungen sind nicht echt.", backToSite: "Zurück zu plekk.be",
};

const all: Record<PublicLocale, PublicStrings> = { nl, fr, en, de };
export const publicStrings = (l: string | null | undefined): PublicStrings => all[(l as PublicLocale) in all ? (l as PublicLocale) : "nl"];
export const publicLocaleTag = (l: string | null | undefined) => ({ nl: "nl-BE", fr: "fr-BE", en: "en-GB", de: "de-DE" }[(l as PublicLocale) ?? "nl"] ?? "nl-BE");
