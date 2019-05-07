const contractSource = `
  contract MemeVote =

      record meme =
        { creatorAddress : address,
          url            : string,
          name           : string,
          voteCount      : int }

      record state =
        { memes      : map(int, meme),
          memesLength : int }

      function init() =
        { memes = {},
          memesLength = 0 }

      public function getMeme(index : int) : meme =
        switch(Map.lookup(index, state.memes))
          None    => abort("There was no meme with this index registered.")
          Some(x) => x

      public stateful function registerMeme(url' : string, name' : string) =
        let meme = { creatorAddress = Call.caller, url = url', name = name', voteCount = 0}
        let index = getMemesLength() + 1
        put(state{ memes[index] = meme, memesLength = index })

      public function getMemesLength() : int =
        state.memesLength

      public stateful function voteMeme(index : int) =
        let meme = getMeme(index)
        Chain.spend(meme.creatorAddress, Call.value)
        let updatedVoteCount = meme.voteCount + Call.value
        let updatedMemes = state.memes{ [index].voteCount = updatedVoteCount }
        put(state{ memes = updatedMemes })
`;
const contractAddress ='ct_2qcqwwXmfLmZ3a18yvnv4p8ta9HGoyHRjCDvPMvyAqkuMRwzPD';
var client = null;
var memeArray = [];
var memesLength = 0;

function renderMemes() {
  memeArray = memeArray.sort(function(a,b){return b.votes-a.votes})
  var template = $('#template').html();
  Mustache.parse(template);
  var rendered = Mustache.render(template, {memeArray});
  $('#memeBody').html(rendered);
}

window.addEventListener('load', async () => {
  $("#loader").show();

  client = await Ae.Aepp();

  const contract = await client.getContractInstance(contractSource, {contractAddress});
  const calledGet = await contract.call('getMemesLength', [], {callStatic: true}).catch(e => console.error(e));
  console.log('calledGet', calledGet);

  const decodedGet = await calledGet.decode().catch(e => console.error(e));
  console.log('decodedGet', decodedGet);

  renderMemes();

  $("#loader").hide();
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
