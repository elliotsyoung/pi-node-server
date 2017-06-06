var mailgunKey = require('../../keys/APIkeys.js').mailgunKey
var domain = 'evergreenmake.com';
var mailgun = require('mailgun-js')({apiKey: mailgunKey, domain: domain});


var MailService = {
  sendWelcomeMail: function(data, token, callback){
    var mail = {
      from: 'Evergreen HQ hello@evergreenmake.com',
      to: `${data.email}`,
      subject: 'Welcome to Evergreen!',
      html:'<html><img src="https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/Welcome_banner.png" width="100%" height="auto">' +
        '<h3 style="text-align: center;">Greetings from Evergreen HQ,</h3> ' +
        '<p style="text-align: center;">Welcome to the Evergreen community. As a supplier you can connect with consumer ' +
        'goods companies in the US that need high quality suppliers like yourself.</p>' +
        '<p style="text-align: center;">Get started by browsing the open proposals section and viewing some of ' +
        'the available RFPs. Makers around the globe are actively submitting proposals to create ' +
        'better products. Read these proposals and submit and offer to win more business.</p>' +
        '<img src="https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/Welcome_demo.png" width="100%" height="auto">' +
        '<p style="text-align: center;">We are looking for feedback to improve the site. If you have any ' +
        'questions, shoot over an email to <a href="mailto:support@evergreenmake.com">support@evergreenmake.com</a> ' +
        'or call our leadership team directly at 1-800-416-0419.</p>' +
        // signature
        '<div style="text-align: center;"><img src="https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/favicon.png" width="25%" height="auto"></div>' +
        '<p>Evergreen | Sourcing Made Simple</p>' +
        '<p>Evergreenmake.com | Tel: 1-800-416-0419</p>' +
        '<p>Address: 1920 Zanker Road San Jose, CA 95112</p>' +
        // end signature
        '</html>'
    };

    mailgun.messages().send(mail, function (error, body) {
      if (error){
        console.log(error);
        callback({status: 400, message: "Email does not exist."});
      } else {
        callback(false, token);
      }
    });
  },
  sendOfferConfirmation: function(data){
    var mail = {
      from: 'Evergreen Team',
      to: `${data.email}`,
      subject: 'Your offer has been sent',
      html: '<html><img src="https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/Welcome_banner.png" width="100%" height="auto"> ' +
      `<h3 style="text-align: center;">Congratulations on submitting your offer to ${data.proposalmakershit}</h3>` +
      `<p style="text-align: center;">${data.proposalmakershit} will review your offer and will choose which supplier has given them the most value.</p>` +
      '<p style="text-align: center;">Here is a summary of your offer:</p>' +
      // offer details
      `<p style="text-align: center;"> We will send you an email if ${data.proposalmakershit} accepts your offer. In the meantime, find ` +
      'other makers that need your services by checking the proposals feed <a href="evergreenmake.com/#!/open-proposals">here</a>.</p>' +
      // signature
      '<div style="text-align: center;"><img src="https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/favicon.png" width="25%" height="auto"></div>' +
      '<p>Evergreen | Sourcing Made Simple</p>' +
      '<p>Evergreenmake.com | Tel: 1-800-416-0419</p>' +
      '<p>Address: 1920 Zanker Road San Jose, CA 95112</p>' +
      // end signature
      '</html>'
    };

    mailgun.messages().send(mail, function(error, body){
      if (error)
        console.log(error);
      else {
        callback();
      }
    });
  },
  sendOrderConfirmation: function(data){
    var mail = {
      from: 'Evergreen Team',
      to: `${data.email}`,
      subject: 'A maker has accepted your offer',
      html: '<html><img src="https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/Welcome_banner.png" width="100%" height="auto">' +
      `<h5>Congratulations! ${data.proposalmakershit} has accepted your offer and wants to work with you. Here's what happens next:</h5>` +
      `<p>${data.proposalmakershit} has agreed to terms with you to produce the following:</p>` + +
      `<p>Item: ${data.actualShit}</p>` +
      `<p>Quantity: ${data.quantityOfShit}</p>` +
      `<p>Delivery Date: ${data.dateExpectingShit}</p>` +
      `<p>Total Amount: ${data.priceOfShit}</p>` +
      '<p>If anything is inaccurate, please contact our support team at 1-800-416-0419 to amend the offer.</p>' +
      // signature
      '<div style="text-align: center;"><img src="https://s3-us-west-1.amazonaws.com/ronintestbucket/public_assets/favicon.png" width="25%" height="auto"></div>' +
      '<p>Evergreen | Sourcing Made Simple</p>' +
      '<p>Evergreenmake.com | Tel: 1-800-416-0419</p>' +
      '<p>Address: 1920 Zanker Road San Jose, CA 95112</p>' +
      // end signature
      '</html>'
    };

    mailgun.messages().send(mail, function(error, body){
      if (error)
        console.log(error);
      else {
        callback();
      }
    });
  },
  sendTicket: function(data, callback){
    // meant to be sent to admin
    var mail = {
      from: 'Evergreen Admin hello@evergreenmake.com',
      to: 'hello@evergreenmake.com',  // Recipient Here (need to verify in mailgun free account)
      subject: `Ticket issued from user ${data[0].contact} at ${data[0].company}`,
      text: `${req.body.text}\n\nReach out to ${data[0].email} for support.`
    };

    mailgun.messages().send(mail, function (error, body) {
      if (error)
        console.log(error);
      else
        callback(false, "A ticket has been sent.");
    });
  }
}

module.exports = MailService;
