/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import * as Rx from 'rxjs/Rx';
import {asyncTest} from '../test-util';

describe('Observable.concat', () => {
  let log: string[];
  const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
  const constructorZone2: Zone = Zone.current.fork({name: 'Constructor Zone2'});
  const constructorZone3: Zone = Zone.current.fork({name: 'Constructor Zone3'});
  const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
  let observable1: any;
  let observable2: any;

  let concatObservable: any;

  beforeEach(() => {
    log = [];
  });

  it('concat func callback should run in the correct zone', () => {
    observable1 = constructorZone1.run(() => {
      return new Rx.Observable(subscriber => {
        expect(Zone.current.name).toEqual(constructorZone1.name);
        subscriber.next(1);
        subscriber.next(2);
        subscriber.complete();
      });
    });

    observable2 = constructorZone2.run(() => {
      return Rx.Observable.range(3, 4);
    });

    constructorZone3.run(() => {
      concatObservable = Rx.Observable.concat(observable1, observable2);
    });

    subscriptionZone.run(() => {
      concatObservable.subscribe((concat: any) => {
        expect(Zone.current.name).toEqual(subscriptionZone.name);
        log.push(concat);
      });
    });

    expect(log).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('concat func callback should run in the correct zone with scheduler',
     asyncTest((done: any) => {
       const constructorZone1: Zone = Zone.current.fork({name: 'Constructor Zone1'});
       const constructorZone2: Zone = Zone.current.fork({name: 'Constructor Zone2'});
       const constructorZone3: Zone = Zone.current.fork({name: 'Constructor Zone3'});
       const subscriptionZone: Zone = Zone.current.fork({name: 'Subscription Zone'});
       observable1 = constructorZone1.run(() => {
         return new Rx.Observable(subscriber => {
           expect(Zone.current.name).toEqual(constructorZone1.name);
           subscriber.next(1);
           subscriber.next(2);
           subscriber.complete();
         });
       });

       observable2 = constructorZone2.run(() => {
         return Rx.Observable.range(3, 4);
       });

       constructorZone3.run(() => {
         concatObservable = Rx.Observable.concat(observable1, observable2, Rx.Scheduler.asap);
       });

       subscriptionZone.run(() => {
         concatObservable.subscribe(
             (concat: any) => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               log.push(concat);
             },
             (error: any) => {
               fail('subscribe failed' + error);
             },
             () => {
               expect(Zone.current.name).toEqual(subscriptionZone.name);
               expect(log).toEqual([1, 2, 3, 4, 5, 6]);
               done();
             });
       });

       expect(log).toEqual([]);
     }, Zone.root));
});