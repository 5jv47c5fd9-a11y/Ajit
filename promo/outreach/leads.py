"""US independent studio leads for Trivora outreach (public Instagram business pages).
Collected from public Instagram listings via web search, October 2026.
Run: python3 leads.py  -> writes us_studio_leads.csv and leads.json
"""
import csv, json, os

# (city, state, studio, handle, type, followers or None, note)
L = [
 # Austin, TX
 ("Austin","TX","Black Swan Yoga Austin","blackswanyogaaustin","Yoga",24000,"Donation-based classes, 6 Austin locations"),
 ("Austin","TX","My Vinyasa Practice","myvinyasapractice","Yoga",45000,"Highland studio, teacher training, yoga therapy"),
 ("Austin","TX","Oak + Lotus Yoga","oakandlotusyoga","Yoga",2305,"Unheated classes, in person + Zoom, new South Congress studio"),
 ("Austin","TX","Dharma Yoga ATX","dharmayogaatx","Yoga",958,"Manor Rd, Austin's longest-running studio (2005)"),
 ("Austin","TX","Bonfire Yoga Studio","bonfireyoga","Yoga",1316,"Infrared heated flow, far Southwest Austin"),
 ("Austin","TX","The Retreat","retreatyogaaustin","Yoga",4418,"Yoga + fitness community, NW Austin since 2015"),
 ("Austin","TX","Yoga hOM Austin","yogahomaustin","Yoga",3808,"Downtown studio"),
 ("Austin","TX","Mysore Austin","mysoreaustin","Yoga",1247,"Mysore-style Ashtanga"),
 # New York, NY
 ("New York","NY","One Yoga NYC","oneyoga.nyc","Yoga",4400,"Hot yoga, Jivamukti, hot Pilates in FiDi"),
 ("New York","NY","The Studio","thestudio.yoga","Yoga",None,"Katonah Yoga, online practice too"),
 ("New York","NY","The Yoga Room","yogaroomnyc","Yoga",None,"NYC studio"),
 ("New York","NY","The Life Yoga Studio","thelifeyogastudio","Yoga",None,"Yoga, sculpt, strength, yin; Manhattan + Belgrade"),
 ("New York","NY","Dharma Yoga NYC","dharmayoganyc","Yoga",88000,"Home of Sri Dharma Mittra's Dharma Yoga"),
 ("New York","NY","St. Marks Yoga","stmarksyoganyc","Yoga",None,"12 St. Marks Place, East Village"),
 ("New York","NY","I Am Yogi Studios","iamyogistudios","Yoga",None,"Queens"),
 ("Brooklyn","NY","Bridge Pilates","bridgepilates","Pilates",None,"Privates and duets only, classical"),
 ("Brooklyn","NY","PILOTE","pilote.pilates","Pilates",None,"Sunset Park reformer; English, Spanish, Chinese"),
 ("Brooklyn","NY","Helen's Intensive Pilates","helenspilates","Pilates",None,"Studios in Brooklyn + Jacksonville, FL"),
 ("Brooklyn","NY","Physio Lab BK","physio_lab_bk","Pilates",None,"Pilates studio, 5 classes for $80 offer"),
 ("Brooklyn","NY","Pilates Vault","pilatesvault","Pilates",None,"3501 Quentin Rd, online booking"),
 ("Brooklyn","NY","Aline Pilates NYC","alinepilatesnyc","Pilates",None,"Classical Pilates, Carroll Gardens"),
 ("Brooklyn","NY","Pilates Heights Brooklyn","pilatesheightsbk","Pilates",None,"Mat, reformer, barre, strength; 4 classes for $90"),
 ("Brooklyn","NY","Prana Delight","prana.delight","Yoga",None,"Bay Ridge: yoga, Pilates, meditation"),
 ("Brooklyn","NY","Yoga House New York","yogahousenewyork","Yoga",None,"Brooklyn"),
 # Los Angeles, CA
 ("Los Angeles","CA","AA Dance Studio","aastudiola","Dance",None,"Adult training programs, kids hip hop, drop-ins"),
 ("Los Angeles","CA","Dancer4Life","dancer4lifeladancestudio","Dance",None,"Ages 2 to adult, Black woman-owned"),
 ("Los Angeles","CA","LA AcroDance Academy","la.acrodanceacademy","Dance",None,"Ballet, contortion, tumbling, jazz; Beverlywood"),
 ("Los Angeles","CA","Los Angeles Dance Center","losangelesdance_center","Dance",None,"Dance studio"),
 ("Los Angeles","CA","Latin Dance Los Angeles","latindancelosangeles","Dance",None,"Salsa and bachata classes"),
 ("Los Angeles","CA","LA DanceFit","ladancefit","Dance",None,"Dance fitness: hip hop, cardio, reggaeton, heels"),
 ("Los Angeles","CA","The Industry Dance Academy","theindustrydanceacademy","Dance",None,"Recreational, competitive, ballet, rentals"),
 ("Los Angeles","CA","The Space LA","thespace_la","Dance",None,"Dance studio"),
 ("Los Angeles","CA","Adoration Studio","adoration_studio","Dance",None,"Adult dance + fitness, burlesque, LGBTQ+ safe space"),
 ("Pasadena","CA","Dance Street","dance_streetca","Dance",None,"Ballroom: salsa, bachata, swing; group + private"),
 ("Los Angeles","CA","Silverlake Pilates Studio","silverlakepilatesstudio","Pilates",185,"Neighborhood Pilates + yoga, Silver Lake"),
 ("Los Angeles","CA","AVENIR Athletic Pilates","avenirpilates","Pilates",17000,"Athletic reformer; Silver Lake, Burbank, Glassell Park, Hollywood"),
 ("Los Angeles","CA","The Pilates Cave","thepilatescave","Pilates",18000,"Reformer + mat"),
 ("Los Angeles","CA","Sol Pilates LA","solpilatesla","Pilates",None,"Reformer + heated mat, free trial"),
 ("Los Angeles","CA","Bodyshop Studio Pilates","bodyshopstudio.co","Pilates",None,"Contemporary Pilates, Arts District"),
 ("Los Angeles","CA","Pilates Culture Club","pilatescultureclub","Pilates",None,"Studio + online membership"),
 ("Venice","CA","B Fitness Venice","bfitnessvenice","Fitness",None,"Barre, mat Pilates, TRX, yoga, personal training"),
 # San Francisco, CA
 ("San Francisco","CA","Yoga Flow SF","yogaflowsf","Yoga",13000,"3 infrared-heated studios, family-owned"),
 ("San Francisco","CA","HAUM SF","haum.studios","Yoga",8500,"Haight + Mission, Best of the Bay"),
 ("San Francisco","CA","Arise Yoga SF","ariseinsanfrancisco","Yoga",900,"Pacific Heights"),
 ("San Francisco","CA","Iyengar Yoga Institute of SF","iyengarsf","Yoga",9200,"Iyengar center since 1974"),
 ("San Francisco","CA","Lotusland","lotusland_yoga_sf","Yoga",4400,"Sliding-scale pricing, unlimited from $125"),
 ("San Francisco","CA","Mission Yoga SF","missionyogasf","Yoga",3100,"Hot yoga + Pilates, Mission District"),
 ("San Francisco","CA","Hot Yoga Plus","hotyogaplusbayarea","Yoga",1200,"SF, Daly City, San Mateo"),
 ("San Francisco","CA","Yoga Beach SF","yogabeachsf","Yoga",2500,"Vinyasa, pre/postnatal"),
 ("San Francisco","CA","Studio by Live Better","studiobylivebetter","Fitness",700,"Wellness studio, Outer Sunset"),
 # San Diego, CA
 ("San Diego","CA","The Sculpt Room","thesculptroompilates","Pilates",9500,"Reformer + hot mat; Pacific Beach, Solana Beach"),
 ("San Diego","CA","Pilates Room Studios","pilatesroomstudios","Pilates",2800,"New-client offer"),
 ("San Diego","CA","Align Pilates","alignpilatessd","Pilates",1800,"Privates; Normal Heights, University Heights"),
 ("San Diego","CA","Alora Fitness","alorafitnesspilates","Pilates",3500,"Modern reformer; Mission Valley + Chula Vista"),
 ("San Diego","CA","Muse Modern Pilates","musemodernpilates","Pilates",570,"Chula Vista studio opening 2026"),
 ("San Diego","CA","Viva Pilates Studio","viva.pilates.studio","Pilates",940,"Latin- and woman-owned"),
 ("San Diego","CA","Honor Pilates","honorpilatesstudios","Pilates",6100,"Power reformer; La Jolla, Kearny Mesa, San Marcos soon"),
 ("San Diego","CA","Empowering Pilates","empoweringpilates","Pilates",430,"Recently opened"),
 # Seattle, WA
 ("Seattle","WA","Nivata Yoga","nivataseattle","Yoga",253,"Meditative yoga practice"),
 ("Seattle","WA","Bohemian Studios","bohemianstudios","Yoga",2786,"Yoga + barre, West Seattle"),
 ("Seattle","WA","Bhakti Studio","bhaktistudioseattle","Yoga",558,"Yoga, meditation, healing; N Northlake Way"),
 ("Seattle","WA","Flood Yoga","floodyoga","Yoga",903,"Yoga + scent studio, Ballard"),
 ("Seattle","WA","Men's Yoga and Bodywork","mensyogaseattle","Yoga",5528,"Classes for men"),
 ("Seattle","WA","Mother Yoga","mother_yoga_seattle","Yoga",3515,"Yoga sanctuary"),
 ("Seattle","WA","Yoga Rama Studio","yogarama_studio","Yoga",316,"Kundalini, breathwork, sound; in studio + online"),
 ("Seattle","WA","Hot Yoga Inc.","hotyogainc","Yoga",2332,"One of the first US hot yoga studios"),
 ("Seattle","WA","Reverie Yoga","reverieyogaseattle","Yoga",1753,"Vinyasa studio"),
 # Portland, OR
 ("Portland","OR","Sellwood Yoga","sellwoodyoga","Yoga",1769,"SE Portland, classes + retreats"),
 ("Portland","OR","All Heart Yoga","allheartyogastudio","Yoga",1425,"NW Portland"),
 ("Portland","OR","Elk Rock Yoga","elkrockyogastudio","Yoga",1648,"Woman-owned indie studio, Woodstock, since 2016"),
 ("Portland","OR","NOW Yoga","nowyoga_pdx","Yoga",3906,"N Williams, SE Division, SE 13th"),
 ("Portland","OR","BhaktiYoga Movement Center","thebhaktiyogamovementcenter","Yoga",5761,"South Asian + queer-owned; classes, yoga school"),
 ("Portland","OR","Begin Pilates & Yoga","beginpilates","Pilates",None,"Pilates + yoga"),
 # Denver, CO
 ("Denver","CO","Ashtanga Yoga Denver","ashtangayogadenver","Yoga",1145,"Traditional Ashtanga, RiNo"),
 ("Denver","CO","Polaris Yoga Denver","polarisyogadenver","Yoga",151,"Vinyasa, Santa Fe Arts District"),
 ("Denver","CO","Canopy Yoga","yoga_canopy","Yoga",4179,"Heated + non-heated, sound baths, smoothie bar"),
 ("Denver","CO","Fit Collective","fitcollectivedenver","Fitness",2031,"HIIT, strength, barre, yoga"),
 ("Denver","CO","Atherial Fitness","atherialfitness","Fitness",1499,"Yoga, barre, aerial"),
 ("Denver","CO","Denver Mysore","denver_mysore","Yoga",77,"Small Ashtanga shala"),
 ("Denver","CO","Rishi's Community Yoga","rishiscommunityyoga","Yoga",461,"Denver legacy business"),
 # Phoenix / Scottsdale, AZ
 ("Scottsdale","AZ","Ulisgold Pilates","ulisgoldpilates","Pilates",1943,"Boutique Pilates, books via website"),
 ("Phoenix","AZ","TriCore","tricorefit","Fitness",2754,"HIIT, strength, reformer Pilates"),
 ("Phoenix","AZ","GROUNDWRK","groundwrkphx","Pilates",9207,"Pilates + yoga, Midtown Phoenix, recently opened"),
 ("Scottsdale","AZ","Hive Fit Club","thehivefitclub","Fitness",30000,"All-in-one luxury wellness club"),
 ("Scottsdale","AZ","Studio Scottsdale Fitness","studioscottsdalefitness","Fitness",1385,"Dance fitness, yoga, strength; studio rental"),
 # Dallas / Houston, TX
 ("Dallas","TX","The PilatesBarre","thepilatesbarre","Pilates",6400,"Reformer + tread since 2011, Devonshire + UP"),
 ("Houston","TX","Soreal Dance Studio","sorealdancestudio","Dance",42000,"Large community studio, classes + rentals"),
 ("Houston","TX","Rhythm Inc Dance Studio","rhythm_inc_dance_studio","Dance",None,"Ballroom, Latin, country; Richmond, Katy, Houston"),
 ("Houston","TX","MxT Movement","mxtdance","Dance",None,"Salsa, bachata, twerk; monthly beginner courses"),
 ("Houston","TX","Cali Dance Houston","cali_dance_houston_","Dance",None,"Kids, teens, adults; quince + wedding choreo"),
 ("Houston","TX","Maestro Dance Academy","maestrodanceacademy","Dance",None,"Ballroom, Latin, wedding; North Houston, Spanish spoken"),
 ("Houston","TX","Janet Hays & Co. Dance","jhaysandcodance","Dance",None,"Ages 2.5+: ballet, hip hop, jazz, tap"),
 # Chicago, IL
 ("Chicago","IL","Studio Yogi","studioyogichicago","Yoga",1600,"Black-owned, hot yoga"),
 ("Chicago","IL","The Lab","labchicago","Yoga",3400,"West Town, teacher trainings"),
 ("Chicago","IL","Big Shoulders Yoga","bigshouldersyoga","Yoga",1800,"Hatha, West Town, online"),
 ("Chicago","IL","Ahimsa Yoga Studio","ahimsayogastudio","Yoga",3600,"Alignment-based; Oak Park, Berwyn, Elmhurst, Evanston"),
 ("Chicago","IL","It's Lit Studio","itslitstudiochicago","Yoga",1800,"Yoga, strength, mobility; 2 locations"),
 ("Chicago","IL","Chi Yoga Shack","chiyogashack","Yoga",2600,"Hatha + Ashtanga"),
 ("Chicago","IL","Zen Yoga Garage","zenyogagarage","Yoga",9700,"Bucktown, livestream, teacher training"),
 ("Chicago","IL","Yogaview","yogaview","Yoga",6300,"Since 2002, teacher training"),
 ("Chicago","IL","Evolve Fitness Chicago","evolvefitnesschicago","Fitness",1300,"Personal training studio, W Belmont"),
 ("Chicago","IL","JOY Fitness Chicago","joy_fit_chicago","Fitness",3600,"Women's boutique fitness, 4 locations"),
 ("Chicago","IL","Studio Fit Chicago","studiofitchicago","Fitness",1700,"Women-only semi-private training"),
 ("Chicago","IL","Lift Chicago","lift_chicago","Fitness",3500,"Private + semi-private training, 4 locations"),
 ("Chicago","IL","Vbody Power Fitness","vbodypowerfitness","Fitness",30000,"PT + group classes; Hyde Park, Lincoln Park, Bronzeville"),
 ("Chicago","IL","HiFi Personal Fitness","hififitness","Fitness",1700,"Large PT studio, River North"),
 ("Chicago","IL","ProFit Studio","profitstudiochicago","Fitness",800,"PT, small group, HYROX prep"),
 ("Chicago","IL","BodyTime Chicago","bodytimechicago","Fitness",6000,"20-minute EMS sessions"),
 ("Chicago","IL","The Hive","chicagohive","Dance",5100,"Creative dance hub for adults"),
 ("Chicago","IL","Chicago Irish Dance Studio","chicagoirishdance","Dance",None,"Irish dance incl. adults"),
 ("Chicago","IL","ABC Dance Academy","abcdanceacademychicago","Dance",None,"Kids + adults: ballet, tap, hip hop, tango"),
 ("Chicago","IL","Austin Lo'ren Chicago","austinlorenchicago","Dance",None,"Adult dance classes + events"),
 ("Chicago","IL","La Bodega Dance Studio","labodega.dance","Dance",None,"Latin, heels, choreography"),
 ("Chicago","IL","Dovetail Studios","dovetail_dance_fitness","Dance",None,"Age 3 to pro, many styles"),
 ("Chicago","IL","Steadfast Dance Center","steadfastdancecenter","Dance",None,"Pilsen, all ages"),
 ("Chicago","IL","Ashley J's Dance Center","ashleyjsdancecenter","Dance",None,"West side, all ages"),
 # Minneapolis, MN
 ("Minneapolis","MN","YogaFit Studios Minneapolis","yogafitstudios_mpls","Yoga",2475,"Fitness-format yoga, all levels"),
 ("Minneapolis","MN","Minneapolis Yoga","mpls.yoga","Yoga",1684,"Hot yoga + Pilates"),
 ("Minneapolis","MN","Yoga Center of Minneapolis","yogacentermpls","Yoga",936,"Yoga for every body"),
 ("Minneapolis","MN","Yess Yoga","yessyoga","Yoga",3843,"South Minneapolis, in person + virtual"),
 ("Minneapolis","MN","Nokomis Yoga","nokomisyoga","Yoga",149,"Independent, 15 years, yoga therapy"),
 ("Minneapolis","MN","Iyengar Yoga Minneapolis","iyengaryogampls","Yoga",1013,"Iyengar school since 1987"),
 # Nashville, TN
 ("Nashville","TN","Studio Novo Nashville","studionovonashville","Fitness",3175,"Lagree; West + East Nashville"),
 ("Nashville","TN","HOTBOX Fitness Nashville","hotboxnashville","Fitness",9006,"Kickboxing, strength, yoga"),
 ("Nashville","TN","The Lab Training Studio","thelabtrainingstudio_","Fitness",9023,"Group classes + sauna"),
 ("Nashville","TN","Willow Pilates + Core","willowpilatesstudio","Pilates",1996,"Classical Pilates since 1999"),
 # Atlanta, GA
 ("Atlanta","GA","The Atlanta Dance Academy","tada_atl","Dance",6543,"Kids, teens, adults; performances"),
 ("Atlanta","GA","Get Up And Dance!","getupanddanceatlanta","Dance",None,"Multi-genre studio for adults"),
 ("Atlanta","GA","Elite Studios","elitestudiosatl","Dance",None,"Ages 3-18, 9 competitive companies"),
 ("Atlanta","GA","Academy Ballroom Atlanta","academyballroomatlanta","Dance",None,"Ballroom, privates + groups"),
 ("Atlanta","GA","Elements Dance Studio","elements_dancestudio","Dance",None,"Salsa, bachata, tango, heels, yoga"),
 ("Atlanta","GA","Jones Dancesport","jonesdancesport","Dance",None,"Adult + kids, wedding dance, Pro-Am"),
 ("Atlanta","GA","Atlanta Contemporary Dance Co.","atlanta_contemporary_dance","Dance",None,"Nonprofit company with classes"),
 # Miami, FL
 ("Miami","FL","Miami Pilates","miamipilates_","Pilates",None,"Reformer + Cadillac; Wynwood, Aventura"),
 ("Miami","FL","Forme Pilates","formepilatesmia","Pilates",None,"Reformer, Miami Lakes"),
 ("Miami","FL","Reforming Pilates Studio","reformingpilates","Pilates",None,"Reformer + heated mat, South Florida + NYC"),
 ("Miami","FL","Miami Reformer Academy","miami.reformer.academy","Pilates",None,"Contemporary Pilates + instructor training"),
 ("Miami","FL","Kinona Pilates","kinonastudio","Pilates",None,"Groups of 4-6; Brickell, Hallandale"),
 ("Miami","FL","Sweat Studio Miami","sweatstudio_miami","Pilates",None,"Reformer + heated mat"),
 ("Miami","FL","Sculpt Fitness","sculptfitnessmia","Pilates",None,"Strength reformer; Miami, Pembroke Pines"),
 ("Miami","FL","FLY Pilates Miami","flypilatesmiami","Pilates",None,"Reformer Pilates"),
 ("Miami","FL","The Method Pilates","themethod_pilates","Pilates",None,"Miami Beach, 2 instructors per class"),
 # Boston, MA
 ("Boston","MA","Boston Body Pilates","bostonbodypilates","Pilates",15000,"Waterfront/North End; also @bostonbodywest"),
 ("Boston","MA","Endurance Pilates and Yoga","endurancepilates","Pilates",6482,"Classical, private + group"),
 ("Boston","MA","Studio78","studio78boston","Pilates",8100,"2 South Boston locations"),
 ("Boston","MA","Pilates Back Bay","pilatesbackbay","Pilates",762,"Fully equipped boutique studio"),
 ("Boston","MA","Impact Pilates","impactpilatesboston","Pilates",301,"STOTT privates + partner sessions"),
 # Philadelphia, PA
 ("Philadelphia","PA","Hot Power Yoga Philly","hpyphilly","Yoga",None,"Infrared power vinyasa + Pilates, 3 locations"),
 ("Philadelphia","PA","Hot Yoga Philly","hotyogaphl","Yoga",None,"Hot yoga, yin, hot Pilates since 2001"),
 ("Philadelphia","PA","Pulse Yoga & Fitness","pulseyogafitness","Yoga",None,"Yoga, sculpt, Pilates on the waterfront"),
 ("Philadelphia","PA","Space & Grace","spaceandgrace.studio","Yoga",None,"Black- and woman-owned yoga studio"),
 ("Philadelphia","PA","Brewerytown Pilates","brewerytownpilates","Pilates",None,"Reformer, mat, springboard; 1458 N 30th St"),
 ("Philadelphia","PA","B You Pilates","b.you.pilates","Pilates",None,"Reformer, South Philly; Moorestown NJ soon"),
 ("Philadelphia","PA","The Pilates & Wellness Studio","thepilatesandwellnessstudio","Pilates",None,"Pilates, barre, strength; Logan Square"),
]

handles = [r[3] for r in L]
assert len(handles) == len(set(handles)), "duplicate handle"
here = os.path.dirname(os.path.abspath(__file__))
rows = [dict(city=c, state=s, studio=n, handle=h, type=t, followers=f, note=no,
             instagram=f"https://www.instagram.com/{h}/", message=f"https://ig.me/m/{h}") for c, s, n, h, t, f, no in L]
with open(os.path.join(here, "us_studio_leads.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["studio", "type", "city", "state", "handle", "instagram", "message", "followers", "note"])
    w.writeheader()
    for r in rows:
        w.writerow({k: ("" if r[k] is None else r[k]) for k in w.fieldnames})
with open(os.path.join(here, "leads.json"), "w") as fh:
    json.dump([[r["city"], r["state"], r["studio"], r["handle"], r["type"], r["followers"], r["note"]] for r in rows], fh, separators=(",", ":"))
from collections import Counter
print(len(rows), "studios |", dict(Counter(r["type"] for r in rows)), "|", len(set((r["city"], r["state"]) for r in rows)), "cities")
