import type { ClientNode } from '@nevis/shared';

export const sampleMonths = ['Jan', 'Feb'];

export const sampleCompany: ClientNode = {
  id: 'company',
  name: 'Company',
  values: [10, 20],
  branches: [
    {
      id: 'branch1',
      name: 'Branch 1',
      values: [7, 15],
      employees: [
        {
          id: 'anna',
          name: 'Anna Blackwood',
          values: [4, 8],
          channels: [
            { id: 'existing', name: 'Existing clients', values: [3, 6] },
            { id: 'new-organic', name: 'New organic', values: [1, 2] },
          ],
        },
        { id: 'james', name: 'James Walker', values: [3, 7] },
      ],
    },
    { id: 'branch2', name: 'Branch 2', values: [3, 5] },
  ],
};
