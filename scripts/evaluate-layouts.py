"""Run bounded synthetic layout evaluations against the local companion only.

No credentials are read. HTTP 200 means server contract validation passed;
usefulness and content coverage require review of the saved responses.
This final run replaces the two earlier pre-completeness debug responses.
"""
import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'docs' / 'evidence'
CASES = [
 ('airport-transfer-selection', 'Design an airport transfer service-selection screen for a traveler with two suitcases. Compare Standard private car and Shared shuttle. Synthetic data: Standard QAR 120, 25-minute ride, two suitcases included, terminal arrivals pickup; Shared QAR 45, 40-minute ride, one suitcase included and QAR 10 for an extra suitcase, shared pickup bay. Show luggage allowance, exact pickup place, duration and all fees in both directions. Explore two complete information hierarchies.', ['QAR 120','QAR 45','QAR 10','25','40','suitcase','pickup']),
 ('older-adult-cleaning-review', 'Design a home-cleaning booking-review screen for an older adult. Synthetic booking: 22 October 2026, arrival window 09:00–10:00, duration 3 hours, 14 Palm Street apartment 2, QAR 180 service plus QAR 20 supplies, QAR 200 total. Show date, arrival window, duration, address and itemized cost; provide a clear final confirmation CTA. Both directions must preserve every fact and prioritize readable review.', ['22','2026','09:00','10:00','3','14 Palm','QAR 180','QAR 20','QAR 200']),
 ('laundry-selection', 'Design a laundry service-selection screen comparing Wash & Fold with Dry Cleaning. Synthetic prices: Wash & Fold QAR 12 per kg, minimum 4 kg, ready in 48 hours; Dry Cleaning QAR 25 per item, minimum 2 items, ready in 72 hours. Explain price units, minimum order and turnaround in both complete directions. Pickup is included; do not invent extra discounts.', ['12','kg','4','48','25','item','2','72','pickup']),
 ('grocery-review', 'Design a grocery order-review screen. Synthetic order: milk QAR 8, rice QAR 20; substitution preference is Ask me first; delivery 24 October 2026 from 18:00–19:00; delivery fee QAR 7; total QAR 35. Both directions must show items, substitution policy, delivery date/window and itemized cost before one Place order action. Preserve all values.', ['milk','8','rice','20','Ask me first','24','2026','18:00','19:00','7','35']),
 ('carwash-selection', 'Design a car-wash service-selection screen. Synthetic options: Exterior QAR 30, 20 minutes, body wash and wheel rinse; Full Care QAR 65, 50 minutes, exterior wash plus interior vacuum and dashboard wipe. Both services happen at Bay 3, West Garage. Both directions must show price, duration, exact location and inclusions. No popularity or savings claims.', ['30','20','65','50','Bay 3','West Garage','wheel','vacuum','dashboard']),
 ('family-airport-review', 'Design an airport-transfer booking-review screen for a family. Synthetic booking: 25 October 2026 at 06:30, pickup 8 Cedar Lane, destination Airport Terminal 1; private van QAR 160 plus one child seat QAR 15 plus airport fee QAR 10, total QAR 185. Show child-seat count, pickup/destination/date/time and all costs in both directions before Confirm transfer.', ['25','2026','06:30','8 Cedar Lane','Terminal 1','160','15','10','185','child']),
 ('recurring-cleaning-selection', 'Design a recurring-cleaning service-selection screen comparing weekly and fortnightly visits. Synthetic terms: weekly QAR 100 per visit, fortnightly QAR 120 per visit; both last 2 hours, scheduling may be changed with 24 hours notice, same inclusions: kitchen surfaces, bathroom clean and floor mop. Preserve every term in both complete directions. Show scheduling flexibility. Do not claim savings, discounts or popularity.', ['weekly','fortnightly','100','120','2','24','kitchen','bathroom','floor']),
 ('laundry-pickup-review', 'Design a laundry pickup booking-review screen. Synthetic booking: 6 items; pickup 26 October 2026 from 10:00–11:00; return 28 October 2026 from 16:00–17:00; 19 Market Road; estimated cleaning QAR 90 plus pickup QAR 10, estimated total QAR 100 pending item inspection. Preserve item count, both date/windows, address, itemized estimate and its qualification in both directions.', ['6','26','28','2026','10:00','11:00','16:00','17:00','19 Market Road','90','10','100','inspection']),
 ('appliance-diagnosis-selection', 'Design an appliance-diagnosis service-selection screen comparing remote video and in-person visits. Synthetic facts: Remote QAR 40 for 30 minutes, requires smartphone camera and Wi-Fi, available 27 October 2026 from 12:00–14:00; In-person QAR 100 for 60 minutes, covers Doha city only, available 28 October 2026 from 09:00–11:00. Neither includes repair parts. Both directions must preserve eligibility, coverage, prices, durations, windows and exclusion.', ['40','30','camera','Wi-Fi','27','12:00','14:00','100','60','Doha','28','09:00','11:00','parts']),
 ('pet-grooming-review', 'Design a pet-grooming booking-review screen. Synthetic details: pet Luna, small dog; service Bath & Trim, 75 minutes; appointment 29 October 2026 at 15:30; salon Green Paws, 4 Elm Street; grooming QAR 140 plus nail trim QAR 20, total QAR 160. Both directions must show pet identity, size, services, time/date, duration, salon/address and itemized price before Confirm appointment.', ['Luna','small','Bath','75','29','2026','15:30','Green Paws','4 Elm Street','140','20','160']),
]

def run(prefix="layout", after_repair=False):
    OUT.mkdir(parents=True, exist_ok=True)
    results=[]
    report={'runAt':datetime.now(timezone.utc).isoformat(),'endpoint':'http://127.0.0.1:8787/companion','scope':('Synthetic local tests after bounded validation repair and content-preservation prompt changes. Original evaluation preserved.' if after_repair else 'Synthetic local tests, corrected complete-screen validation. Prior pre-completeness debug responses replaced.')+' HTTP success is not a usefulness verdict.','cases':results}
    for number,(name,brief,cues) in enumerate(CASES,1):
        request=Request(report['endpoint'], data=json.dumps({'tool':'layout','brief':brief,'history':[]}).encode(),headers={'Origin':'http://127.0.0.1:5173','Content-Type':'application/json'},method='POST')
        started=time.monotonic()
        try:
            with urlopen(request,timeout=50) as response:
                status=response.status;body=response.read(256001)
        except HTTPError as error:
            status=error.code;body=error.read(256001)
        except Exception as error:
            status=0;body=json.dumps({'error':type(error).__name__}).encode()
        elapsed=round(time.monotonic()-started,3)
        try: reply=json.loads(body)
        except ValueError: reply={'error':'Non-JSON response'}
        path=OUT/f'{prefix}-eval-{number:02d}.json';path.write_text(json.dumps(reply,ensure_ascii=False,indent=2)+'\n')
        options=(reply.get('artifact') or {}).get('options',[])
        checks=[]
        for option in options:
            serialized=json.dumps(option,ensure_ascii=False).casefold()
            checks.append({'directionId':option.get('id'),'arrangement':option.get('arrangement'),'components':[s.get('component') for s in option.get('sections',[])],'missingLiteralCues':[cue for cue in cues if cue.casefold() not in serialized]})
        result={'id':number,'name':name,'brief':brief,'httpStatus':status,'seconds':elapsed,'responseFile':path.name,'directionChecks':checks,'review':'Pending qualitative review; literal cue checks are heuristic.'}
        results.append(result)
        report['http200Count']=sum(r['httpStatus']==200 for r in results)
        report['attempted']=len(results)
        (OUT/f'{prefix}-evaluation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
        print(json.dumps({'case':number,'name':name,'status':status,'seconds':elapsed,'checks':checks}),flush=True)
        if status==429:
            print('Stopped: quota exhausted.',flush=True);break
if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--after-repair',action='store_true')
    args=parser.parse_args()
    run('layout-after-repair' if args.after_repair else 'layout',args.after_repair)
