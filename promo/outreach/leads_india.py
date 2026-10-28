"""Indian independent studio leads for Trivora outreach (public Instagram business pages).
Collected from public Instagram listings via web search, October 2026.
Run: python3 leads_india.py  -> writes india_studio_leads.csv and leads_india.json
"""
import csv, json, os

# (city, state, studio, handle, type, followers or None, note)
L = [
 # Mumbai metro
 ("Mumbai","MH","Iyengar Yoga Andheri","iyengaryoga_andheri","Yoga",1579,"Iyengar batches Mon/Wed/Fri"),
 ("Mumbai","MH","The Yoga House","theyogahousemumbai","Yoga",17000,"Yoga, sound healing, breathwork, cafe, teacher training"),
 ("Mumbai","MH","Ayam Yoga Juhu","ayamyogastudio","Yoga",None,"Juhu, classes 6:30 AM to 8 PM"),
 ("Mumbai","MH","The Yoga Tribe Studio","theyogatribestudio","Yoga",None,"Classes, workshops, retreats, studio rental"),
 ("Mumbai","MH","Vogue The Yoga Studio","voguetheyogastudio","Yoga",None,"Women-only; yoga, aerial, Zumba, Pilates; Mumbai Central"),
 ("Mumbai","MH","Menkaas Pilates Studio","menkaaspilatesstudio","Pilates",3074,"Reformer, Cadillac, chair, barrel; Lokhandwala"),
 ("Mumbai","MH","Flow House Juhu","flowhouse.pilates","Pilates",2817,"Small-group + private reformer, Juhu"),
 ("Mumbai","MH","FORM Pilates & Physio","formpilatesandphysio","Pilates",968,"Reformer + physio; Andheri W, Vile Parle E"),
 ("Thane","MH","Neo Pilates Studio","neopilates_in","Pilates",None,"Reformer studio, Thane West"),
 ("Navi Mumbai","MH","Helekars Pilates Studio","helekarspilatesstudio","Pilates",None,"Pilates studio, Navi Mumbai"),
 ("Mumbai","MH","The Dance Class","the.danceclass","Dance",11000,"Beginner + advanced batches, in studio + online"),
 ("Mumbai","MH","Boombox Dance Classes","boomboxdanceclass","Dance",15000,"Classes, workshops, sangeet choreography; Andheri W"),
 ("Mumbai","MH","The Flex Dance Studio","theflexdancestudio","Dance",None,"Dance, fitness, rehearsals, shoots; Andheri"),
 ("Mumbai","MH","House Of Dance Studio by MCH","houseofdanceofficial","Dance",None,"Regular classes + studio rental"),
 ("Mumbai","MH","DOI Studio","dancersofindiastudio","Dance",None,"Dancers of India studio, Andheri W"),
 ("Mumbai","MH","Star Dance Mumbai","stardanceco_mumbai","Dance",None,"Bachata, group + private"),
 ("Mumbai","MH","Ramzat Garba Mumbai","ramzat_garba_dance_classes","Dance",7600,"Garba classes"),
 ("Mira Road","MH","We Dance Studio","wedancestudio_miraroad","Dance",None,"Kids, teens, adults; enquiries on WhatsApp"),
 ("Panvel","MH","SM Dance Studio","smdancestudio__","Dance",None,"Dance + Zumba, online and offline, rental"),
 ("Mumbai","MH","Elite Fitness","elitefitnessmumbai","Fitness",1985,"Owner-run personal training studio since 2007, Girgaum"),
 # Delhi NCR
 ("Delhi","DL","Nikki Yoga Studio","nikkiyogastudio","Yoga",2300,"Prenatal, postnatal, kids yoga, meditation"),
 ("Delhi","DL","Lifeyoga","lifeyoga_","Yoga",15000,"Yoga centre in Chanakyapuri"),
 ("Delhi","DL","The Shala Delhi","theshaladelhi","Yoga",3700,"Ashtanga; Delhi + Gurgaon"),
 ("Gurugram","HR","AumYogaShala","aumyogashala_ays","Yoga",9500,"Hatha, Ashtanga, Yoga Alliance teacher training"),
 ("Gurugram","HR","STUDIO by Central Dynamics","centraldynamics.gurugram","Pilates",None,"Reformer, spin, PT; DLF Phase 1; 2-class trial"),
 ("Gurugram","HR","Balance Pilates","balancepilatesindia","Pilates",None,"Gurgaon, Vikas Marg, Greater Noida"),
 ("Delhi","DL","Coreflex Pilates Studio","coreflexpilatesstudio","Pilates",4300,"Reformer, barre, mat, aerial, yoga"),
 ("Gurugram","HR","Movement Pilates","movementpilatesindia","Pilates",10000,"Sushant Lok + Sector 65"),
 ("Delhi","DL","Butterfly Pilates","butterflypilatesstudio","Pilates",438,"Reformer, trial sessions; East Patel Nagar"),
 ("Noida","UP","Roots Dance Studio","rootsdance_studio","Dance",57000,"Classes + wedding choreography; Sector 49"),
 ("Noida","UP","RJ Dance Studio","rjdance_studio","Dance",22000,"Sectors 104 + 52, online sessions"),
 ("Noida","UP","Dancing Mantras","dancingmantras","Dance",8099,"Classes, events, workshops"),
 ("Noida","UP","Shakti Dance Studio","shaktidancestudiosds","Dance",1109,"Hip hop, kathak, wedding choreo, Zumba"),
 ("Delhi","DL","Delhi Dance Academy","delhidanceacademy","Dance",5777,"Kalkaji; studio + online"),
 ("Delhi","DL","Skool of Hip Hop","skoolofhiphopp","Dance",196000,"Studio classes + online live"),
 ("Delhi","DL","Revive Studios","revivestudiosrs","Dance",20000,"Jazz, heels, dancehall, contemporary; book by DM"),
 ("Delhi","DL","Divine Movement Studio","divinemovementstudio","Dance",169,"Dance, fitness, aerial, yoga; Chhatarpur"),
 ("Delhi","DL","KNOX Studio","knox.studio","Fitness",15000,"Group training, Delhi + Gurgaon; also @lab.knox"),
 ("Delhi","DL","Exerholic Fitness Studio","exerholic_fitness_studio","Fitness",4356,"Group, duet, personal training"),
 ("Gurugram","HR","Studio 88","studio88_fitness","Fitness",3023,"Reformer, heated yoga, sculpt, dance fitness"),
 # Bengaluru
 ("Bengaluru","KA","AthaYog Living","athayogliving","Yoga",4200,"Indiranagar 12th Main, SVYASA-affiliated"),
 ("Bengaluru","KA","Bodhi School of Yoga","bodhi_school_of_yoga_bengaluru","Yoga",21000,"Indiranagar, HSR Layout"),
 ("Bengaluru","KA","House of Pilates","houseofpilatesstudio","Pilates",2900,"Reformer, chair, pre/postnatal, physio; JP Nagar"),
 ("Bengaluru","KA","Zone Mind & Body Studio","zonebangalore","Pilates",1700,"Boutique PT + equipment Pilates, rehab"),
 ("Bengaluru","KA","Aatma Pilates Studio","aatmapilatesstudiobyramya","Pilates",1400,"Classical Pilates at JW Marriott"),
 ("Bengaluru","KA","Purple Pilates","purplepilatesblr","Pilates",800,"Reformer, aerial yoga; Koramangala/HSR"),
 ("Bengaluru","KA","Crafted Pilates","craftedpilates","Pilates",1000,"Mat + reformer, 1:1 and group"),
 ("Bengaluru","KA","Pilates Zone","pilateszone2024","Pilates",200,"New studio, Nagarbhavi"),
 ("Bengaluru","KA","DNA Dance An Addiction","dance_n_addiction","Dance",38000,"Classes, workshops, wedding dance"),
 ("Bengaluru","KA","Core Dance Studio","coredancestudio.in","Dance",7588,"Kids + adults, Kumaraswamy Layout"),
 ("Bengaluru","KA","Bangalore Dance Studio","bangalore.dance.studio","Dance",1148,"Kammanahalli + Bidrahalli"),
 ("Bengaluru","KA","DanciGo Dance Studio","dancigo.blr","Dance",1962,"Freestyle, Bollywood, hip hop; HSR Layout"),
 ("Bengaluru","KA","LVDS","lvdsindia","Dance",5445,"Salsa, bachata, WCS; Vasanthnagar + Indiranagar"),
 ("Bengaluru","KA","Furor","furorent","Dance",4259,"Salsa, Koramangala + Zoom"),
 ("Bengaluru","KA","Preetha Arun Bharatanatyam Academy","preetha_dance","Dance",10000,"Bharatanatyam for kids + adults, Whitefield"),
 ("Bengaluru","KA","Dhrutham Studio of Dance","dsod_dhrutham_studio_dance","Dance",6090,"Dance + fitness, kids to adults"),
 ("Bengaluru","KA","Burn Dance & Fitness Studio","burnstudio_bangalore","Dance",275,"Dance for all ages, women's Zumba"),
 ("Bengaluru","KA","Excel Dance and Fitness","exceldanceandfitness","Dance",169,"BTM Layout + Koramangala"),
 ("Bengaluru","KA","HYFIT Hybrid Fitness Club","hyfit.fitnessclub","Fitness",10000,"Movement-first community, HSR"),
 ("Bengaluru","KA","BASE Personal Training","thebase.fit","Fitness",582,"Small-group + 1:1 PT, HSR"),
 ("Bengaluru","KA","Cyborg Fitness","cyborgfitnessblr","Fitness",3011,"3 Whitefield branches; MMA, boxing, Zumba, yoga"),
 ("Bengaluru","KA","Zest Fitness Studio","zestfitnessstudio_koramangala","Fitness",None,"Fitness studio, Koramangala"),
 ("Bengaluru","KA","The Studio by Copper + Cloves","thestudiobycopperandcloves","Fitness",None,"Cafe studio: yoga, Pilates, group training, sound"),
 # Hyderabad
 ("Hyderabad","TG","Adika","adika.in","Yoga",3100,"Yoga, Pilates, swimming; Kompally + Jubilee Hills"),
 ("Hyderabad","TG","Studio Ananta","ananta.hyd","Yoga",14000,"Yoga, Pilates, aerial yoga"),
 ("Hyderabad","TG","Align The Pilates Studio","alignthepilates","Pilates",270,"STOTT Pilates + TRX, Banjara Hills"),
 ("Hyderabad","TG","Steps Dance Studio","stepsdancestudiohyd","Dance",768,"Hip hop, salsa, jazz, ballet, Zumba"),
 ("Hyderabad","TG","Energy Dance Fitness Studioz","energydancefitnessstudioz","Dance",6682,"Zumba, Bollywood, contemporary; Madhapur"),
 ("Hyderabad","TG","Cherrys Dance Studio","cherrys_dance_studio","Dance",19000,"KPHB Colony"),
 ("Hyderabad","TG","TI Dance Studio","tidancestudio","Dance",708,"Bandlaguda Jagir"),
 ("Hyderabad","TG","B&D Dance Studio","bd_dance_studio","Dance",122,"Vanasthalipuram"),
 ("Hyderabad","TG","DanceWithMe Studio","dancewithmestudio_","Dance",18000,"All age groups, Manikonda"),
 ("Hyderabad","TG","Gurukul Dance Studio","gurukuldancestudio","Dance",1729,"Bollywood, hip hop, Kathak, Zumba"),
 ("Hyderabad","TG","MAD Dance Studio","mad_dance_studio_","Dance",123,"Classes, fitness, choreography"),
 # Pune
 ("Pune","MH","Riyasa Studio","riyasa_studio","Yoga",None,"Aerial + dance yoga, Baner"),
 ("Pune","MH","Heels Dance Academy","heelsdanceacademy","Dance",7000,"Salsa, kizomba, belly, Bollywood, Kathak; Magarpatta"),
 ("Pune","MH","Pune Latin Dance Academy","pune_latin_dance_academy","Dance",None,"Salsa, bachata, kizomba; 4 locations"),
 ("Pune","MH","Anipra Dance Academy","anipra_dance_academy","Dance",None,"Hinjewadi, studio rental"),
 ("Pune","MH","The Dance Foundation Pune","tdfpune","Dance",None,"All levels, studio rental"),
 ("Pune","MH","Streak Studio","streak_studio_pune","Dance",None,"Zumba, kids dance, wedding choreo"),
 ("Pune","MH","KS Dance Institute","ks_dance_institute1","Dance",None,"Classes, weddings, workshops"),
 ("Pune","MH","Padanaad Dance Studio","padanaad","Dance",None,"Bharatanatyam classes"),
 ("Pune","MH","Soul Dance Academy","soul_dance_academy_pune","Dance",None,"Classes, workshops, movement therapy"),
 ("Pune","MH","Dancing Devils Dance Studio","dancing_devils_dance_studio","Dance",None,"Wakad"),
 ("Pune","MH","Dance In Motion India","danceinmotionindia","Dance",None,"NIBM dance + fitness studio"),
 ("Pune","MH","Stark Fitness","stark_fitness_pune","Fitness",None,"Functional fitness studio"),
 # Chennai
 ("Chennai","TN","Chennai Yoga Studio","chennaiyogastudio","Yoga",5000,"Hybrid classes, TTC; Kilpauk + Anna Nagar"),
 ("Chennai","TN","Tattva The Studio","tattva_thestudio","Yoga",67000,"Yoga, aerial, Pilates, dance fitness; ECR + Nungambakkam"),
 ("Chennai","TN","YogaWorks Chennai","yogaworks.chennai","Yoga",3000,"Hatha, vinyasa, aerial, prenatal, TTC"),
 ("Chennai","TN","D'Alpha Dance Company","alphadancecompany","Dance",None,"Kids, teens, adults + dance fitness; Adyar"),
 ("Chennai","TN","Dance Off Dance & Fitness","danceoffdance","Dance",7400,"Kids + adult classes, workshops"),
 ("Chennai","TN","The Dance Inn","the_dance_inn","Dance",None,"Mylapore, free trial by DM"),
 ("Chennai","TN","Nadanta","nadanta_dancestudio","Dance",89000,"Aesthetic dance, classes by DM"),
 ("Chennai","TN","Mr.Danczz Studio","mr.danczz_studio","Dance",None,"Kids + adults, Perambur"),
 ("Chennai","TN","The Chennai Dance Palace","thechennaidancepalace","Dance",None,"Regular + personal classes, studio space"),
 ("Chennai","TN","Western Culture Dance Studio","westernculturedancestudio","Dance",None,"Adambakkam"),
 ("Chennai","TN","Vins Dance Co","vinsdanceco","Dance",None,"Bollywood, Latin, heels; Chennai + Bengaluru"),
 ("Chennai","TN","NatyaTaara Dance Company","natyataara","Dance",None,"Bharatanatyam, cinematic, wedding choreo"),
 ("Chennai","TN","Raack Academy of Dance","raack_official","Dance",None,"Classes + choreography"),
 # Kolkata
 ("Kolkata","WB","Frolic Yoga and Dance Studio","frolicstudio_kolkata","Yoga",153,"Yoga + dance, hourly rental"),
 ("Kolkata","WB","Body Mantra Kolkata","bodymantrakol","Yoga",878,"Yoga, Zumba, dance, workshops"),
 ("Kolkata","WB","Studio Cocoon","studiococoonkolkata","Dance",18000,"Dance, fitness, events, shoots"),
 ("Kolkata","WB","Dance Different Center","dance.different","Dance",22000,"Dance, fitness, kids"),
 ("Kolkata","WB","A.R.T Dance & Fitness Studio","artstudio_india","Dance",None,"Dance + fitness"),
 ("Kolkata","WB","Divine Dance & Fitness Studio","divinedanceandfitnestudio","Dance",12000,"Dance, Zumba, aerobics, yoga"),
 ("Kolkata","WB","KKH Dance Academy","kkh_dance_academy","Dance",88,"Dance, aerobics, yoga, wedding choreo"),
 ("Kolkata","WB","Aerobicize Zumba & Dance Studio","aerobicizestudio","Dance",462,"Zumba, yoga, Pilates, dance"),
 # Ahmedabad
 ("Ahmedabad","GJ","Nidhis Yoga Hub","nidhisyogahub","Yoga",27000,"4 branches in Ahmedabad"),
 ("Ahmedabad","GJ","Animesh Yoga Studio","animeshyogastudio","Yoga",5947,"Online + offline"),
 ("Ahmedabad","GJ","Om Divine Yoga Studio","om_divine_yoga_studio","Yoga",1421,"Naroda"),
 ("Ahmedabad","GJ","136.1 Yoga Studio","136.1yogastudio_ahmedabad","Yoga",800,"Vedanta, mantra, meditation"),
 ("Ahmedabad","GJ","Sculpt & Soar","sculptandsoar","Pilates",921,"Reformer + mat Pilates"),
 ("Ahmedabad","GJ","CoreCraft The Pilates Studio","corecraft_thepilatesstudio","Pilates",551,"Pilates studio"),
 # Jaipur
 ("Jaipur","RJ","Balance Studio Jaipur","balancestudiojaipur","Yoga",6179,"Ashtanga, aerial, belly dance, prenatal; Civil Lines"),
 ("Jaipur","RJ","Verayoga","verayoga_jaipur","Yoga",5945,"Aerial yoga, therapy"),
 ("Jaipur","RJ","Yogapeace Jaipur","yogapeace_jaipur","Yoga",113000,"Five yoga courses"),
 ("Jaipur","RJ","Sampoornaa Yoga","sampoornaayoga_india","Yoga",None,"Yoga studio"),
 ("Jaipur","RJ","Pragya Yoga Alliance","pragyayogaofficial","Yoga",None,"Yoga studio + training"),
 ("Jaipur","RJ","MR Dance Studio","mr.dance.studio","Dance",1082,"Dance, fitness and yoga classes"),
 ("Jaipur","RJ","Desire Dance Studio","desire_dance_studio","Dance",127000,"Choreographer-led dance studio"),
 # Chandigarh tricity
 ("Mohali","PB","Mudra Yoga & Pilates Studio","mudrayogastudiomohali","Yoga",6710,"Prenatal, PCOS-focused, live classes"),
 ("Chandigarh","CH","Revive Pilates & Yoga","revivestudiochd","Pilates",44,"New studio, personal + group"),
 ("Chandigarh","CH","Lemuria Yoga Studio","lemuria_yoga_studio","Yoga",608,"Boutique yoga studio"),
 ("Mohali","PB","Space Seven Fitness","spacesevenfitness","Fitness",None,"Strength, movement, dance, physio, cafe"),
 # Goa
 ("Goa","GA","Goa Yogashala","goayogashala","Yoga",73000,"Teacher training + Ayurveda retreats"),
 ("Goa","GA","Adiyogam Goa","adiyogam.goa","Yoga",None,"Drop-ins, aerial, Iyengar, TTC, retreats"),
 ("Goa","GA","Agastya Yoga Goa","agastyayog","Yoga",None,"200/300-hr TTC + retreats, near Keri Beach"),
 ("Goa","GA","Yoga Mandir","yogamandirgoa","Yoga",None,"Yoga school, South Goa"),
]

handles = [r[3] for r in L]
assert len(handles) == len(set(handles)), "duplicate handle"
here = os.path.dirname(os.path.abspath(__file__))
rows = [dict(city=c, state=s, studio=n, handle=h, type=t, followers=f, note=no,
             instagram=f"https://www.instagram.com/{h}/", message=f"https://ig.me/m/{h}") for c, s, n, h, t, f, no in L]
with open(os.path.join(here, "india_studio_leads.csv"), "w", newline="") as fh:
    w = csv.DictWriter(fh, fieldnames=["studio", "type", "city", "state", "handle", "instagram", "message", "followers", "note"])
    w.writeheader()
    for r in rows:
        w.writerow({k: ("" if r[k] is None else r[k]) for k in w.fieldnames})
with open(os.path.join(here, "leads_india.json"), "w") as fh:
    json.dump([[r["city"], r["state"], r["studio"], r["handle"], r["type"], r["followers"], r["note"]] for r in rows], fh, separators=(",", ":"))
from collections import Counter
print(len(rows), "studios |", dict(Counter(r["type"] for r in rows)))
