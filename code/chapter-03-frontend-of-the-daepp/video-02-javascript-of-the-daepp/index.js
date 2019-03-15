var memeArray = [
    {"creatorName": "Alice","memeUrl": "https://pbs.twimg.com/media/Dsdt6gOXcAAksLu.jpg","votes":18, "index":1, "rank":1},
    {"creatorName": "Bob","memeUrl": "https://pbs.twimg.com/media/C4Vu1S0WYAA3Clw.jpg","votes":27, "index":2, "rank":2},
    {"creatorName": "Carol","memeUrl": "https://pbs.twimg.com/media/DeHbsSAU0AAbQAq.jpg","votes":14, "index":3, "rank":3}
  ];


function renderMemes() {
  memeArray = memeArray.sort(function(a,b){return b.votes-a.votes})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {memeArray});
  $('#memeBody').html(rendered);
}

window.addEventListener('load', async () => {
  renderMemes();
});

jQuery("#memeBody").on("click", ".voteBtn", async function(event){
  const value = $(this).siblings('input').val();
  const dataIndex = event.target.id;
  const foundIndex = memeArray.findIndex(meme => meme.index == dataIndex);
  memeArray[foundIndex].votes += parseInt(value, 10);
  renderMemes();
});

$('#registerBtn').click(async function(){
  var name = ($('#regName').val()),
      url = ($('#regUrl').val());

  memeArray.push({
    creatorName: name,
    memeUrl: url,
    index: memeArray.length+1,
    votes: 0
  })
  renderMemes();
});
