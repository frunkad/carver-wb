const aircrafts = {
    "sex": { bem: 763.16, arm: 42.21, taxi: 3.8 },
    "tnt": { bem: 760.81, arm: 40.02, taxi: 3.8 },
    "ftv": { bem: 765.00, arm: 39.49, taxi: 3.8 },
    "leo": { bem: 764.00, arm: 40.18, taxi: 3.8 },
    "ice": { bem: 765.00, arm: 39.22, taxi: 3.0 },
    "hot": { bem: 717.00, arm: 41.73, taxi: 3.0 },
    "aag": { bem: 760.90, arm: 43.87, taxi: 3.8 },
    "aal": { bem: 766.50, arm: 43.06, taxi: 3.8 },
    "tlb": { bem: 1419.20, arm: 14.95, taxi: 0 }
}

function hello(inp) {
    bem = Object.values(aircrafts)[inp].bem;
    arm = Object.values(aircrafts)[inp].arm;
    taxi = Object.values(aircrafts)[inp].taxi;
    moment = bem * arm;
    aircraftname = Object.keys(aircrafts)[inp];
}
//extra
const arrow = document.querySelector('.arrow');


const aircrafterror = document.querySelector('.msgac1');
const fuelerror = document.querySelector('.error1');
const weighterror = document.querySelector('.error2');


const output = document.querySelector('.outputcontainer');
const submitbtn = document.querySelector('#submitbutton');
const dropdownlist = document.querySelector('.aircraft-dropdown');

output.classList.add('hidden');

dropdownlist.innerHTML = Object.keys(aircrafts)
    .map(
        (opt, j) => `<label class="aircraft-option" for=${opt}>VT - ${opt.toUpperCase()}</label>
                                <input type="radio" name="aircraft" class="option" id=${opt} value=${j} />`
    ).join('');


const selectAircraft = document.querySelector('#select-aircraft');
const selectOption = document.querySelectorAll('.aircraft-option');

selectAircraft.addEventListener('click', () => {
    dropdownlist.classList.toggle('hidden');
    arrow.classList.toggle('arrowup');
});


let aa;
selectOption.forEach(op => {
    op.addEventListener('click', () => {
        dropdownlist.classList.toggle('hidden');
        selectAircraft.firstElementChild.innerHTML = op.innerHTML;
        aircrafterror.innerHTML = "";
        arrow.classList.toggle('arrowup');
        aa = op.nextElementSibling.value;
        aa = parseFloat(aa);
    });
});

const ffuel = document.querySelector('#usableFuel');

const ppicweight = document.querySelector('#weightPIC');
const ccoweight = document.querySelector('#weightStudent');

ffuel.addEventListener('keydown', () => {
    fuelerror.innerHTML = "";
});
ppicweight.addEventListener('keydown', () => {
    weighterror.innerHTML = "";
});

submitbtn.addEventListener('click', (e) => {
    e.preventDefault();

    outdedo(aa + 1);

});


function outdedo(aavalue) {

    const ac = aavalue - 1;

    const fuel = ffuel.value * 0.72;

    const picweight = ppicweight.value * 1;
    const coweight = ccoweight.value * 1;

    if (selectAircraft.firstElementChild.innerText == "Select Aircraft") {
        aircrafterror.innerHTML = "Select Aircraft";
        return;
    }
    else if (fuel == 0 || fuel == "") {
        fuelerror.innerHTML = "Please Enter Fuel";
        return;
    }
    else if (picweight == 0 || picweight == "") {
        weighterror.innerHTML = "Please Enter Weight";
        return;
    }
    else {
        output.classList.remove('hidden');
        document.querySelector('.inputcontainer').classList.add('hidden');
        hello(ac);

        const ramp = (bem + fuel + picweight + coweight);
        const rampmoment = (moment + (fuel * 48) + (picweight * 37) + (coweight * 37));

        const takeoff = ramp - taxi;
        const takeoffmoment = rampmoment - (taxi * 48);

        const takeoffTLB = (bem + fuel + picweight + coweight);
        const takeoffmomentTLB = (moment + (fuel * 30.32) + (picweight * (-37.4)) + (coweight * (-37.4)));


        const centerofgravity = takeoffmoment / takeoff;
        const centerofgravityTLB = takeoffmomentTLB / takeoffTLB;



        if (aircraftname == "tlb") {
            output.innerHTML = `
        <div class="entered">
                <div class="outl">
                    <span>You Selected Aircraft:</span>
                    <span>VT - ${(aircraftname).toUpperCase()}</span>
                </div>
                <div class="outl">
                    <span>fuel enterd:</span>
                    <span>${(fuel / 0.72).toFixed(2)} (L)</span>
                </div>
                <div class="outl">
                    <span>fuel in kgs: ( ${(fuel / 0.72).toFixed(0)} x 0.72 ) = </span>
                    <span>${fuel.toFixed(2)} (Kg)</span>
                </div>
            </div>
            <div class="output">
                <table>
                    <thead>
                        <tr>
                            <td><b>Sr No.</b></td>
                            <td><b>Item Description</b></td>
                            <td><b>Weight</b></td>
                            <td><b>Arm</b></td>
                            <td><b>Moment</b></td>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>1</td>
                            <td>Basic Empty Weight</td>
                            <td>1419.20</td>
                            <td>14.95</td>
                            <td>21217.04</td>
                        </tr>
                        <tr>
                            <td>2</td>
                            <td>Pilot Seat</td>
                            <td>${picweight.toFixed(2)}</td>
                            <td>-37.4</td>
                            <td>${(picweight * (-37.4)).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>3</td>
                            <td>Co-Pilot</td>
                            <td>${coweight.toFixed(2)}</td>
                            <td>-37.4</td>
                            <td>${(coweight * (-37.4)).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>4</td>
                            <td>Seat No 3</td>
                            <td><hr></td>
                            <td>-5.75</td>
                            <td><hr></td>
                        </tr>
                        <tr>
                            <td>5</td>
                            <td>Seat No 4</td>
                            <td><hr></td>
                            <td>-5.75</td>
                            <td><hr></td>
                        </tr>
                        <tr>
                            <td>6</td>
                            <td>Seat No 5</td>
                            <td><hr></td>
                            <td>34.13</td>
                            <td><hr></td>
                        </tr>
                        <tr>
                            <td>7</td>
                            <td>Seat No 6</td>
                            <td><hr></td>
                            <td>34.13</td>
                            <td><hr></td>
                        </tr>
                        <tr>
                            <td>8</td>
                            <td>Seat No 7</td>
                            <td><hr></td>
                            <td>34.13</td>
                            <td><hr></td>
                        </tr>
                        <tr>
                            <td>9</td>
                            <td>Baggage <span>(Max 400 LBS)</span></td>
                            <td><hr></td>
                            <td>60.7</td>
                            <td><hr></td>
                        </tr>
                        <tr>
                            <td>10</td>
                            <td>FUEL</td>
                            <td>${fuel.toFixed(2)}</td>
                            <td>30.32</td>
                            <td>${(fuel * 30.32).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td></td>
                            <td>TOTAL</td>
                            <td>${takeoffTLB.toFixed(2)}</td>
                            <td></td>
                            <td>${takeoffmomentTLB.toFixed(2)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="cg">
                <div class="cglim">
                    <!-- <span>Take-off weight in lbs</span>
                    <span>786.00</span> -->
                </div>
                <div class="cglim">
                    <span>C.G. in inches = Total Moment / Total Weight   = ${centerofgravityTLB.toFixed(3)}</span>
                </div>
                <div class="cglim">
                    <span>C.G. in inches = <strong>${centerofgravityTLB.toFixed(2)}</strong></span>
                    <span>Within limit: <strong><span id="limits">Yes</span></strong></span>
                </div>
                <div class="cglim">
                    <span>( CG limit FWD=0.320 Mt (12.6 inch) and AFT-0.481 Mt (18.92 inch))</span>
                </div>
            </div>
        `;
        }
        else {
            output.innerHTML =
                `
            <div class="entered">
                <div class="outl">
                    <span>You Selected Aircraft:</span>
                    <span>VT - ${(aircraftname).toUpperCase()}</span>
                </div>
                <div class="outl">
                    <span>fuel enterd:</span>
                    <span>${(fuel / 0.72).toFixed(2)} (L)</span>
                </div>
                <div class="outl">
                    <span>fuel in kgs: ( ${(fuel / 0.72).toFixed(0)} x 0.72 ) = </span>
                    <span>${fuel.toFixed(2)} (Kg)</span>
                </div>
            </div>
            <div class="output">
                <table>
            <thead>
                <tr>
                    <td><b>Sr No.</b></td>
                    <td><b>Item Description</b></td>
                    <td><b>Weight</b></td>
                    <td><b>Arm</b></td>
                    <td><b>Moment</b></td>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>1</td>
                    <td>Basic Empty Weight</td>
                    <td>${bem.toFixed(2)}</td>
                    <td>${arm.toFixed(2)}</td>
                    <td>${moment.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td>Usable fuel</td>
                    <td>${fuel.toFixed(2)}</td>
                    <td>48</td>
                    <td>${(fuel * 48).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>3</td>
                    <td>Pilot(PIC)</td>
                    <td>${picweight.toFixed(2)}</td>
                    <td>37</td>
                    <td>${(picweight * 37).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>4</td>
                    <td>Co-Pilot(Student)</td>
                    <td>${coweight.toFixed(2)}</td>
                    <td>37</td>
                    <td>${(coweight * 37).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>5</td>
                    <td>Rear Passengers</td>
                    <td><hr></td>
                    <td>73</td>
                    <td><hr></td>
                </tr>
                <tr>
                    <td>6</td>
                    <td>Baggage Area 1</td>
                    <td><hr></td>
                    <td>95</td>
                    <td><hr></td>
                </tr>
                <tr>
                    <td>7</td>
                    <td>Baggage Area 2</td>
                    <td><hr></td>
                    <td>123</td>
                    <td><hr></td>
                </tr>
                <tr>
                    <td>8</td>
                    <td>Ramp Weight</td>
                    <td>${ramp.toFixed(2)}</td>
                    <td></td>
                    <td>${rampmoment.toFixed(2)}</td>
                </tr>
                <tr>
                    <td>9</td>
                    <td>Engine Start and Taxi Fuel</td>
                    <td>${taxi.toFixed(2)}</td>
                    <td>48</td>
                    <td>${(taxi * 48).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>10</td>
                    <td>Take-off Weight</td>
                    <td>${takeoff.toFixed(2)}</td>
                    <td>${centerofgravity.toFixed(2)}</td>
                    <td>${takeoffmoment.toFixed(2)}</td>
                </tr>
            </tbody>
        </table>
            </div>
            <div class="cg">
                <div class="cglim">
                    <span>Take-off weight in lbs</span>
                    <span>${(takeoff * 2.2).toFixed(2)}</span>
                </div>
                <div class="cglim">
                    <span>C.G. in inches = ${centerofgravity.toFixed(3)}</span>
                    <span>Moment / Weight = ${centerofgravity.toFixed(3)}</span>
                </div>
                <div class="cglim">
                    <span>C.G. in inches = <strong>${centerofgravity.toFixed(2)}</strong></span>
                    <span>Within limit: <strong><span id="limits">Yes</span></strong></span>
                </div>
                <div class="cglim">
                    <span>( CG limit Range: 35.0 to 47.3 inches aft of Datum )</span>
                </div>
            </div>
        `;
        }


        if (centerofgravityTLB < 12.6 || centerofgravityTLB > 18.92) {
            if (centerofgravity < 35 || centerofgravity > 47.3) {
                document.querySelector('#limits').innerHTML = "NO";
            }
        }
        else {
            document.querySelector('#limits').innerHTML = "YES";
        }

    }

}
