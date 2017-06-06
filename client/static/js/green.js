$('#categoryDropper').dropdown();

$('.ui.dropdown').dropdown();

$('.ui.sticky').sticky({
  context: '#offerWrapper'
});

// $('.nda-trigger').click(function() {
//   $('#ndaWindow').modal('show');
// });

$('.nda-view').click(function() {
  $('#ndaView').modal('show');
});

$('.send-offer').click(function() {
  $('#offerSent').modal('show');
});

$('.nda-confirmation').click(function() {
  $('#areYouSure').modal('show');
});

$('.add-note').click(function() {
  $('#addNote').modal('show');
});

$('.download-folder').click(function() {
  $('#downloadFolder').modal('show');
});

$('.accept-offer').click(function() {
  $('#acceptOffer').modal('show');
});

$('.accepted-success').click(function() {
  $('#acceptedSuccess').modal('show');
});

$('.invite-supplier').click(function() {
  $('#inviteSupplier').modal('show');
});

$('.thumbnails .item').tab();

$('.steps .trigger').tab();

$('.message-contacts .item').tab();
$('.detail-panel .menu .item').tab();
//This line was commented because it interfered with the progress tracking bar on the account-maker-tracking partial. This code is related to semantic UI, we will fix it later.
// $('.indicating.progress').progress();
