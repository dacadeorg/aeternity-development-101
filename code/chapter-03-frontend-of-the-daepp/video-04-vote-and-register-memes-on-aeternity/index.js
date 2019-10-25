const contractSource = `
  payable contract MemeVote =

    record meme =
      { creatorAddress : address,
        url            : string,
        name           : string,
        voteCount      : int }

    record state =
      { memes      : map(int, meme),
        memesLength : int }

    entrypoint init() =
      { memes = {},
        memesLength = 0 }

    entrypoint getMeme(index : int) : meme =
      switch(Map.lookup(index, state.memes))
        None    => abort("There was no meme with this index registered.")
        Some(x) => x

    stateful entrypoint registerMeme(url' : string, name' : string) =
      let meme = { creatorAddress = Call.caller, url = url', name = name', voteCount = 0}
      let index = getMemesLength() + 1
      put(state{ memes[index] = meme, memesLength = index })

    entrypoint getMemesLength() : int =
      state.memesLength

    payable stateful entrypoint voteMeme(index : int) =
      let meme = getMeme(index)
      Chain.spend(meme.creatorAddress, Call.value)
      let updatedVoteCount = meme.voteCount + Call.value
      let updatedMemes = state.memes{ [index].voteCount = updatedVoteCount }
      put(state{ memes = updatedMemes })
`;

//Address of the meme voting smart contract on the testnet of the aeternity blockchain
const contractAddress = 'ct_CxxTpqYdtqhzVjCtggeV4obBtwW6hLjsmTUhWzDXFS417Sqe6';
//Create variable for client so it can be used in different functions
var client = null;
//Create a new global array for the memes
var memeArray = [];
//Create a new variable to store the length of the meme globally
var memesLength = 0;

function renderMemes() {
  //Order the memes array so that the meme with the most votes is on top
  memeArray = memeArray.sort(function(a,b){return b.votes-a.votes})
  //Get the template we created in a block scoped variable
  let template = $('#template').html();
  //Use mustache parse function to speeds up on future uses
  Mustache.parse(template);
  //Create variable with result of render func form template and data
  let rendered = Mustache.render(template, {memeArray});
  //Use jquery to add the result of the rendering to our html
  $('#memeBody').html(rendered);
}

//Create a asynchronous read call for our smart contract
async function callStatic(func, args) {
  //Create a new contract instance that we can interact with
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to get data of smart contract func, with specefied arguments
  const calledGet = await contract.call(func, args, {callStatic: true}).catch(e => console.error(e));
  //Make another call to decode the data received in first call
  const decodedGet = await calledGet.decode().catch(e => console.error(e));

  return decodedGet;
}

//Create a asynchronous write call for our smart contract
async function contractCall(func, args, value) {
  const contract = await client.getContractInstance(contractSource, {contractAddress});
  //Make a call to write smart contract func, with aeon value input
  const calledSet = await contract.call(func, args, {amount: value}).catch(e => console.error(e));

  return calledSet;
}

//Execute main function
window.addEventListener('load', async () => {
  //Display the loader animation so the user knows that something is happening
  $("#loader").show();

  //Initialize the Aepp object through aepp-sdk.browser.js, the base app needs to be running.
  client = await Ae.Aepp();

  //First make a call to get to know how may memes have been created and need to be displayed
  //Assign the value of meme length to the global variable
  memesLength = await callStatic('getMemesLength', []);

  //Loop over every meme to get all their relevant information
  for (let i = 1; i <= memesLength; i++) {

    //Make the call to the blockchain to get all relevant information on the meme
    const meme = await callStatic('getMeme', [i]);

    //Create meme object with  info from the call and push into the array with all memes
    memeArray.push({
      creatorName: meme.name,
      memeUrl: meme.url,
      index: i,
      votes: meme.voteCount,
    })
  }

  //Display updated memes
  renderMemes();

  //Hide loader animation
  $("#loader").hide();
});

//If someone clicks to vote on a meme, get the input and execute the voteCall
jQuery("#memeBody").on("click", ".voteBtn", async function(event){
  $("#loader").show();
  //Create two new let block scoped variables, value for the vote input and
  //index to get the index of the meme on which the user wants to vote
  let value = $(this).siblings('input').val(),
      index = event.target.id;

  //Promise to execute execute call for the vote meme function with let values
  await contractCall('voteMeme', [index], value);

  //Hide the loading animation after async calls return a value
  const foundIndex = memeArray.findIndex(meme => meme.index == event.target.id);
  //console.log(foundIndex);
  memeArray[foundIndex].votes += parseInt(value, 10);

  renderMemes();
  $("#loader").hide();
});

//If someone clicks to register a meme, get the input and execute the registerCall
$('#registerBtn').click(async function(){
  $("#loader").show();
  //Create two new let variables which get the values from the input fields
  const name = ($('#regName').val()),
        url = ($('#regUrl').val());

  //Make the contract call to register the meme with the newly passed values
  await contractCall('registerMeme', [url, name], 0);

  //Add the new created memeobject to our memearray
  memeArray.push({
    creatorName: name,
    memeUrl: url,
    index: memeArray.length+1,
    votes: 0,
  })

  renderMemes();
  $("#loader").hide();
});
