// src/guardian/guardian.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Child, ChildDocument } from './entities/child.entity';
import { Guardian, GuardianDocument } from './entities/guardian.entity';
import { CreateChildDto } from './dto/create-child.dto';
import { LinkChildDto } from './dto/link-child.dto';
import { User } from 'src/user/schemas/user.schema';
import { TaskDocument, TaskDuration } from './entities/task.entity';
import { AssignTaskDto } from './dto/assign-task.dto';

@Injectable()
export class GuardianService {
  constructor(
    // @InjectModel(Child.name) private childModel: Model<ChildDocument>,
    @InjectModel('Guardian') private guardianModel: Model<GuardianDocument>,
    @InjectModel('Child') private childModel: Model<ChildDocument>,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Task') private taskModel: Model<TaskDocument>,
    
  ) {}

  private async generateUniqueLoginCode(): Promise<string> {
    let loginCode: string;
    let existingChild;

    do {
      loginCode = Math.floor(100000 + Math.random() * 900000).toString();
      existingChild = await this.childModel.findOne({ loginCode });
    } while (existingChild);

    return loginCode;
}

 

async setRole(firebaseUid: string, role: string) {
    try {
      console.log('Setting role for:', { firebaseUid, role });
      
      // First get the MongoDB user ID
      const user = await this.userModel.findOne({ firebaseUid });
      
      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Create guardian role
      const guardian = await this.guardianModel.create({
        guardianUserId: user._id,  // Using guardianUserId as per schema
        role: role,
        status: 'active'  // Since this is a direct role assignment
      });

      console.log('Guardian role created:', guardian);
      return guardian;

    } catch (error) {
      console.error('Error in setRole:', error);
      throw error;
    }
  }
  


  async addChild(firebaseUid: string, createChildDto: CreateChildDto) {
    try {
      const user = await this.userModel.findOne({ firebaseUid });
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      const guardian = await this.guardianModel.findOne({
        guardianUserId: user._id,
        role: 'guardian'
      });
  
      if (!guardian) {
        throw new BadRequestException('User is not a guardian');
      }
  
      // Generate unique login code
      const loginCode = await this.generateUniqueLoginCode();
      
      // Generate unique ID (you can modify this format as needed)
      const uniqueId = `CHILD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  
      // Create child with all required fields
      const child = await this.childModel.create({
        parentId: user._id,  // Using guardianUserId as parentId
        name: createChildDto.name,
        age: createChildDto.age,
        uniqueId: uniqueId,  // Add uniqueId
        loginCode: loginCode,
        isActive: true
      });
  
      return {
        ...child.toJSON(),
        loginCode
      };
    } catch (error) {
      console.error('Error in addChild:', error);
      throw error;
    }
  }



 

  async linkChildAccount(loginCode: string, firebaseUid: string) {
    try {
      // Find child by login code
      const child = await this.childModel.findOne({ 
        loginCode,
        isActive: true 
      });
  
      if (!child) {
        throw new NotFoundException('Invalid login code');
      }
  
      // Get user from firebase UID
      const user = await this.userModel.findOne({ firebaseUid });
      if (!user) {
        throw new NotFoundException('User not found');
      }
  
      // Check if child already linked
      const existingGuardian = await this.guardianModel.findOne({
        childUserId: user._id
      });
  
      if (existingGuardian) {
        throw new BadRequestException('Child account already linked');
      }
  
      // Create guardian record with child role
      await this.guardianModel.create({
        guardianUserId: user._id,
        role: 'child',
        status: 'active',
        parentId: child.parentId // Link to parent
      });
  
      // Update child record
      child.uniqueId = `LINKED-${child.uniqueId}`;  // Update uniqueId to show linked status
      await child.save();
  
      return {
        ...child.toJSON(),
        userId: user._id
      };
    } catch (error) {
      console.error('Error linking child account:', error);
      throw error;
    }
  }

  async getChildren(firebaseUid: string) {
  try {
    const user = await this.userModel.findOne({ firebaseUid });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const children = await this.childModel.find({
      parentId: user._id.toString(),
      isActive: true
    }).lean();

    // Get tasks for each child
    const childrenWithTasks = await Promise.all(
      children.map(async (child) => {
        const tasks = await this.taskModel.find({
          childId: child._id,
          isActive: true
        }).lean();

        return {
          ...child,
          tasks
        };
      })
    );

    return childrenWithTasks;
  } catch (error) {
    console.error('Error getting children:', error);
    throw error;
  }
}

async removeChild(guardianId: string, childId: string) {
  try {
    console.log('Starting removeChild:', { guardianId, childId });

    // First verify guardian exists
    const guardian = await this.userModel.findOne({ firebaseUid: guardianId });
    if (!guardian) {
      console.log('Guardian not found:', guardianId);
      throw new NotFoundException('Guardian not found');
    }
    console.log('Found guardian:', guardian._id);

    // Find and update child
    const child = await this.childModel.findOneAndUpdate(
      {
        _id: new Types.ObjectId(childId),
        parentId: guardian._id,
        isActive: true
      },
      { isActive: false },
      { new: true }
    );

    console.log('Child update result:', child);

    if (!child) {
      console.log('Child not found or already inactive:', {
        childId,
        parentId: guardian._id
      });
      throw new NotFoundException('Child not found');
    }

    // Also deactivate associated tasks
    const taskUpdate = await this.taskModel.updateMany(
      { childId: new Types.ObjectId(childId), isActive: true },
      { isActive: false }
    );
    console.log('Tasks update result:', taskUpdate);

    return child;
  } catch (error) {
    console.error('Error in removeChild:', error);
    throw error;
  }
}

  async getChildDetails(userId: string) {
    const child = await this.childModel.findOne({
      userId: new Types.ObjectId(userId),
      isActive: true
    }).populate('guardianId', 'name phoneNumber');

    if (!child) {
      throw new NotFoundException('Child account not found');
    }

    return child;
  }

  async getRole(firebaseUid: string) {
    try {
      console.log('Looking up user with firebaseUid:', firebaseUid);
      
      // First find the user by firebaseUid
      const user = await this.userModel.findOne({ firebaseUid });
      
      if (!user) {
        console.log('No user found for firebaseUid:', firebaseUid);
        throw new NotFoundException('User not found');
      }
      
      console.log('Found user:', user._id);

      // Then find guardian using user's MongoDB _id
      const guardian = await this.guardianModel.findOne({
        guardianUserId: user._id  // Now using the MongoDB _id
      });
      
      console.log('Found guardian:', guardian);
      
      if (!guardian) {
        throw new NotFoundException('Role not found');
      }
      
      return { role: guardian.role };
    } catch (e) {
      console.log('Error getting role:', e);
      throw new NotFoundException('Role not found');
    }
  }

  async assignTask(userId: string, assignTaskDto: AssignTaskDto) {
    try {
      console.log('Starting assignTask with data:', JSON.stringify(assignTaskDto, null, 2));
  
      const parentId = new Types.ObjectId(userId);
      const childId = new Types.ObjectId(assignTaskDto.childId);
      
      // First verify parent-child relationship
      const child = await this.childModel.findOne({
        _id: childId,
        parentId: parentId,
        isActive: true
      }).exec();
  
      if (!child) {
        throw new NotFoundException('Child not found or does not belong to parent');
      }
  
      // Prepare task data with properly destructured reward fields
      const taskData = {
        parentId,
        childId,
        title: assignTaskDto.title,
        description: assignTaskDto.description,
        type: assignTaskDto.type,
        level: assignTaskDto.level || 1,
        points: assignTaskDto.points || 0,
        assignedDate: new Date(),
        duration: assignTaskDto.duration || TaskDuration.DAILY,
        isCompleted: false,
        isValidated: false,
        isActive: true,
        badges: [],
        // Properly extract reward fields
        rewardType: assignTaskDto.reward.type,
        rewardDescription: assignTaskDto.reward.description,
        rewardPoints: assignTaskDto.reward.points || 0
      };
  
      console.log('Creating task with data:', JSON.stringify(taskData, null, 2));
  
      // Create and save the task
      const taskDocument = new this.taskModel(taskData);
      const savedTask = await taskDocument.save();

      // Update child's assignedTasks array
      await this.childModel.findByIdAndUpdate(
        childId,
        {
          $push: { assignedTasks: savedTask._id }
        },
        { new: true }
      );

      console.log('Task assigned and child updated successfully');
      
      return savedTask;
    } catch (error) {
      console.error('Error in assignTask:', {
        error: error.message,
        stack: error.stack,
        originalError: error
      });
      throw error;
    }
  }
async getTasks(firebaseUid: string) {
    try {
      const user = await this.userModel.findOne({ firebaseUid });
      if (!user) throw new NotFoundException('User not found');
      
      const parentId = new Types.ObjectId(user._id);
      
      const tasks = await this.taskModel
        .find({ parentId })
        .populate('childId', 'name')
        .exec();

      return tasks;
    } catch (error) {
      console.error('Error getting tasks:', error);
      throw error;
    }
}

async validateTask(taskId: string, userId: string) {
  try {
    const task = await this.taskModel.findOne({
      _id: new Types.ObjectId(taskId),
      parentId: new Types.ObjectId(userId)
    });

    if (!task) {
      throw new NotFoundException('Task not found or unauthorized');
    }

    if (!task.isCompleted) {
      throw new BadRequestException('Task must be completed before validation');
    }

    task.isValidated = true;
    const updatedTask = await task.save();

    return updatedTask;
  } catch (error) {
    throw error;
  }
}

}