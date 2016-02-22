import axios from 'axios';
import Firebase from 'firebase';

const FB_REF = new Firebase('http://xkcdthoughts.firebaseio.com');

export async function getThoughts(cb){
  try {
    let snapshot = await FB_REF.child('thoughts').once('value', snapshot => {
      return snapshot;
    });
    const data = Object.keys(snapshot.val()).map(function(key) {
        return snapshot.val()[key].value;
      });
    cb(data);
  } catch(err) {
    console.log(err);
  }
}