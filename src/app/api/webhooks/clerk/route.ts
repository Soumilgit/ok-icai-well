import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { createOrUpdateUser, updateUserActivity, initializeUserTables } from '@/lib/database';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse('Error occurred -- no svix headers', {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new NextResponse('Error occurred', {
      status: 400,
    });
  }

  // Initialize tables if needed
  try {
    await initializeUserTables();
  } catch (error) {
    console.error('Error initializing tables:', error);
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`Webhook with and ID of ${id} and type of ${eventType}`);
  console.log('Webhook body:', body);

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated':
        const userData = {
          clerkId: evt.data.id,
          email: evt.data.email_addresses[0]?.email_address || '',
          firstName: evt.data.first_name || '',
          lastName: evt.data.last_name || '',
          profileImageUrl: evt.data.profile_image_url || '',
        };

        const user = await createOrUpdateUser(userData);
        console.log('User created/updated:', user);

        // Log activity
        if (user) {
          await updateUserActivity(
            user.id,
            eventType === 'user.created' ? 'account_created' : 'profile_updated',
            { clerk_id: evt.data.id, event_type: eventType }
          );
        }
        break;

      case 'session.created':
        // Update last login time
        try {
          const userResult = await createOrUpdateUser({
            clerkId: evt.data.user_id,
            email: evt.data.user?.email_addresses?.[0]?.email_address || '',
            firstName: evt.data.user?.first_name || '',
            lastName: evt.data.user?.last_name || '',
            profileImageUrl: evt.data.user?.profile_image_url || '',
          });
          
          if (userResult) {
            await updateUserActivity(
              userResult.id,
              'user_login',
              { session_id: evt.data.id, clerk_user_id: evt.data.user_id }
            );
          }
        } catch (error) {
          console.error('Error handling session.created:', error);
        }
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new NextResponse('', { status: 200 });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}