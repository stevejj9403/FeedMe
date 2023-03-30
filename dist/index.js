//1/24/2023

import { initializeApp } from 'firebase/app'
import {
    getFirestore, collection, onSnapshot,
    addDoc, doc, deleteDoc,
    getDoc, updateDoc, getDocs, setDoc, DocumentSnapshot, query, where
} from 'firebase/firestore'
import {
    getAuth,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signOut,
    signInWithEmailAndPassword,
    onAuthStateChanged
} from 'firebase/auth'

const firebaseConfig = {
    apiKey: "AIzaSyA-6MiR5rbgOGqF9rk-kR2t1pTjJ07QwbM",
    authDomain: "feedme-84463.firebaseapp.com",
    projectId: "feedme-84463",
    storageBucket: "feedme-84463.appspot.com",
    messagingSenderId: "874509794699",
    appId: "1:874509794699:web:a43655f47ba661e2d2438e",
    measurementId: "G-RL1P1D44QX"
  }


//init firebase app for firebase database collection
initializeApp(firebaseConfig)

//init services
const db = getFirestore()
const auth = getAuth()

//collection reference
const userCollectionRef = collection(db, 'user')

//signing users up
const signUpForm = document.querySelector('#signup-form')
signUpForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const email = signUpForm['signup-email'].value;
    const password = signUpForm['signup-password'].value;
    

    const checkStatus = document.getElementById('truckCheckBox').checked;

    createUserWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            console.log('user created:', cred.user);
            if(checkStatus) {
                setDoc(doc(db, 'user', cred.user.uid), {
                    truck: true,
                });
            } else {
                setDoc(doc(db, 'user', cred.user.uid), {
                    truck: false,
                });
            }
            
            const modal = document.querySelector('#modal-signup');
            M.Modal.getInstance(modal).close();
            signUpForm.reset();
            
        })
        .catch((err) => {
            console.log(err.message)
        })
    
    
})

// logging in and out
const logoutButton = document.getElementById('logout')
logoutButton.addEventListener('click', (e) => {
    e.preventDefault()
    cancelCreatePin();
        signOut(auth)
            .then(() =>{
                console.log('the user signed out')
            })
            .catch((err) => {
                console.log(err.message)
            })
})

const loginForm = document.querySelector('#login-form');
const loginFail = document.querySelector('.login-fail');
loginForm.addEventListener('submit', (e) => {
    e.preventDefault()

    const email = loginForm['login-email'].value;
    const password = loginForm['login-password'].value;

    signInWithEmailAndPassword(auth, email, password)
        .then((cred) => {
            //console.log('user logged in:', cred.user)
            loginForm.reset()
            loginFail.innerHTML ='';
            loginFail.style.backgroundColor = 'white';

            const modal = document.querySelector('#modal-login');
            M.Modal.getInstance(modal).close();
            signUpForm.reset();
        })
        .catch((err)=> {
            const html = '<div>Failed log-in</div>';
            loginFail.innerHTML = html;
            loginFail.style.backgroundColor = 'red';
            console.log(err.message)
        })
})

//Subscribing to auth changes
onAuthStateChanged(auth, (user) => {
    if(user) {
        console.log('user logged in:', user);
        setupUI(user);
    } else {
        setupUI();
        console.log('user logged out');
    }
    
});


const loggedOutLinks = document.querySelectorAll('.logged-out');
const loggedInLinks = document.querySelectorAll('.logged-in');
const truckOwnerLink = document.querySelector('.truckowner');
const accountDetails = document.querySelector('.account-details');

const setupUI = async (user) => {
    if(user) {      
        const docSnap = await getDoc(doc(db,'user', user.uid));
        // console.log(docSnap.data());

        var html = ' <p><b>Email: </b>' + user.email + '</p>';

        console.log(docSnap.data().truck);
        if(docSnap.data().truck) {
            html = '<h5>Truck Owner</h5>' + html;
            
            if(docSnap.get('truckinfo')) {
                var str = docSnap.get('truckinfo');
                var strName = str.substring(str.indexOf('Truck Name: ') + 12,str.indexOf('</h4>'));
                var strInfo = str.substring(str.indexOf('Description: ') + 13,str.indexOf('</p>'));
                html = html + "<p><b> Truck Name: </b>" + strName + '</p>';
                html = html + '<p><b>Truck Info: </b>' + strInfo + '</p>';
            }

            truckOwnerLink.style.display= 'block';
        } else {
            truckOwnerLink.style.display= 'none';
            html = '<h5>Customer</h5>' + html;
        }
        

        accountDetails.innerHTML = html;

        //toggle Ui elements 
        loggedInLinks.forEach(item=> item.style.display = 'block');
        loggedOutLinks.forEach(item => item.style.display = 'none');
        } else {
        //toggle UI elements
        accountDetails.innerHTML = '';
        truckOwnerLink.style.display = 'none';
        loggedInLinks.forEach(item=> item.style.display = 'none');
        loggedOutLinks.forEach(item => item.style.display = 'block');
    }
}

const pinForm = document.getElementById('create-pin-form');
const createPin = document.getElementById('create-pin-menu');
createPin.addEventListener('click', ()=> {
    var mapRef = document.getElementById('map');
    mapRef.style.width = '80%';
    
    pinForm.style.display = '';
})

function cancelCreatePin() {
    var mapRef = document.getElementById('map');
    mapRef.style.width = '100%';

    pinForm.style.display = 'none';
}

const cancelButton = document.getElementById('cancel-pin').addEventListener('click', cancelCreatePin);

/*
    THIS IS ALL GOOGLE MAPS API BELOW
*/

// Initialize and add the map
function initMap() {

    const map = new google.maps.Map(document.getElementById("map"), {
      zoom: 12,
      center: {lat:36.1447, lng: -86.8027}
    });

    function addMarkerByClick(ev) {
      addMarker({coords: ev.latLng});
    }

    var listener;
    
    const cancelPin = document.getElementById('cancel-pin');
    cancelPin.addEventListener('click', ()=> {
      google.maps.event.removeListener(listener);
    });

    const truckInfoSubmit = document.getElementById('truck-sub');
    var text;

    truckInfoSubmit.addEventListener('click', ()=> {
      const truckNameRef = document.getElementById('truck-name');
      const truckDescRef = document.getElementById('truck-desc');

      text = "<h4>Truck Name: " + truckNameRef.value + '</h4>';
      text = text + "<p>Description: " + truckDescRef.value + '</p>';

      const truckForm = document.querySelector('#create-form');
      truckForm.reset()

      listener = map.addListener('click', addMarkerByClick);
      document.getElementById('instruction2').style.display = '';
    });

    async function start () {
        const q = query(collection(db, 'user'), where('lat', '!=', null));
        const querySnapshot = await getDocs(q);

        querySnapshot.forEach((doc)=> {
            const marker = new google.maps.Marker({
                title: doc.get('truckinfo'),
                position: {lat: doc.get('lat'), lng: doc.get('lng')},
                map: map,
              });

              const infoWindow = new google.maps.InfoWindow( {
                content : marker.getTitle(),
              });

            marker.addListener("click", () => {
                infoWindow.open({
                  anchor:marker,
                  map
                })
              });
              
            //Listener to delete markers
            // marker.addListener('dblclick', () => {
            //     const u =auth.currentUser;
            //     if(u.uid === doc.id) {
            //         marker.setMap(null);
            //     }
            // });
        });
    }
    start();

    // Add marker function
    function addMarker(props) {
      
      const marker = new google.maps.Marker({
          title: text,
          position: props.coords,
          map: map,
        });

        const infoWindow = new google.maps.InfoWindow( {
          content : marker.getTitle(),
        })

        marker.addListener("click", () => {
          infoWindow.open({
            anchor:marker,
            map
          })
        })
        const user = auth.currentUser;
        const docRef = doc(db,'user', user.uid);

        // Deleting a marker OR Reload page once marker has been replaced
        marker.addListener('dblclick', () => {
          console.log(user.uid + " " + docRef.id);
            if(user.uid === docRef.id) {
                marker.setMap(null);
            }
        });

        const longitude = marker.getPosition().lng();
        const latitude = marker.getPosition().lat();

        setDoc(docRef, { lat: latitude, lng: longitude,truck: true, truckinfo: marker.title}, {merge:true});
        

      document.getElementById('create-pin-form').style.display = 'none';
      document.getElementById('map').style.width = '100%';
      google.maps.event.removeListener(listener);
      document.getElementById('instruction2').style.display = 'none';
      setupUI(user);
    }

    //searchBox
    var input = document.getElementById('search');
    var searchBox = new google.maps.places.SearchBox(input);

    map.addListener('bounds_changed', function() {
      searchBox.setBounds(map.getBounds());
    });

    searchBox.addListener('places_changed', function() {
      var places = searchBox.getPlaces();

      if(places.length===0)
        return;

      var bounds = new google.maps.LatLngBounds();

      places.forEach(function (p) {
        if(!p.geometry)
          return;

          if(p.geometry.viewport)
            bounds.union(p.geometry.viewport)
          else
            bounds.extend(p.geometry.location)
      });
      map.fitBounds(bounds);
    });
  }
  
  window.initMap = initMap;